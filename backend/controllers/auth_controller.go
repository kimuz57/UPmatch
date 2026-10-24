package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	
	"upmatch-backend/config" // นำเข้า config เพื่อใช้งาน RedisClient
	"upmatch-backend/utils"
)

type OTPRequest struct {
	Email string `json:"email"`
	Year  int    `json:"year"`
}

type VerifyRequest struct {
	Email string `json:"email"`
	OTP   string `json:"otp"`
}

func SendOTP(c *fiber.Ctx) error {
	var req OTPRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
	}

	// 1. สุ่มรหัส OTP 6 หลัก
	otp := utils.GenerateOTP()

	// 2. บันทึก OTP ลง Redis พร้อมตั้งเวลาหมดอายุ (5 นาที)
	redisKey := fmt.Sprintf("upmatch:otp:%s", req.Email)
	err := config.RedisClient.Set(config.Ctx, redisKey, otp, 5*time.Minute).Err()
	if err != nil {
		log.Println("❌ บันทึก Redis ล้มเหลว:", err)
		return c.Status(500).JSON(fiber.Map{"error": "ระบบขัดข้อง ไม่สามารถสร้างรหัส OTP ได้"})
	}
	log.Printf("✅ บันทึก OTP ลง Redis สำเร็จ: %s สำหรับอีเมล: %s (หมดอายุใน 5 นาที)", otp, req.Email)

	// สำหรับบัญชีทดสอบที่ขึ้นต้นด้วย 123 ให้ใช้ OTP 123456 เสมอโดยไม่ต้องยิง Gmail จริง
	if strings.HasPrefix(req.Email, "123") {
		_ = config.RedisClient.Set(config.Ctx, redisKey, "123456", 24*time.Hour).Err()
		log.Printf("🧪 บัญชีทดสอบ %s: ใช้ OTP 123456", req.Email)
		return c.Status(200).JSON(fiber.Map{
			"message": "รหัส OTP ทดสอบคือ 123456",
		})
	}

	// 3. ส่งอีเมลจริง
	err = utils.SendEmailOTPWithGmailAPI(req.Email, otp)
	if err != nil {
		// ทริค: ถ้าส่งเมล์ไม่สำเร็จ ให้ลบ OTP ใน Redis ทิ้งทันที ป้องกันขยะตกค้าง
		config.RedisClient.Del(config.Ctx, redisKey) 
		
		log.Println("❌ ส่งอีเมลล้มเหลว:", err)
		return c.Status(500).JSON(fiber.Map{
			"error": fmt.Sprintf("ไม่สามารถส่งอีเมลได้: %v", err),
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"message": "ส่งรหัส OTP ไปที่อีเมล " + req.Email + " เรียบร้อยแล้ว",
	})
}

func VerifyOTP(c *fiber.Ctx) error {
	var req VerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
	}

	// 1. ดึง OTP จาก Redis ตามอีเมลที่ขอมา
	redisKey := fmt.Sprintf("upmatch:otp:%s", req.Email)
	savedOTP, err := config.RedisClient.Get(config.Ctx, redisKey).Result()
	
	if strings.HasPrefix(req.Email, "123") && req.OTP == "123456" {
		savedOTP = "123456"
		err = nil
	} else if err == redis.Nil {
		// หา key ไม่เจอ = รหัสหมดอายุไปแล้ว 5 นาที หรืออีเมลนี้ยังไม่ได้กดขอ OTP
		return c.Status(400).JSON(fiber.Map{"error": "รหัส OTP หมดอายุหรือไม่ถูกต้อง"})
	} else if err != nil {
		log.Println("❌ ดึงข้อมูล Redis ล้มเหลว:", err)
		return c.Status(500).JSON(fiber.Map{"error": "ระบบเซิร์ฟเวอร์ขัดข้อง"})
	}

	// 2. ตรวจสอบว่ารหัสตรงกับที่ผู้ใช้กรอกมาไหม
	if req.OTP != savedOTP {
		return c.Status(400).JSON(fiber.Map{"error": "รหัส OTP ไม่ถูกต้อง"})
	}

	// 3. ถ้ารหัสถูกต้อง ให้ลบ OTP ออกจาก Redis ทันที ป้องกันการนำกลับมาใช้ซ้ำ (Replay Attack)
	config.RedisClient.Del(config.Ctx, redisKey)

	// 4. สร้าง Secure Random Session Token ที่ไม่ซ้ำกันสำหรับผู้ใช้แต่ละคน
	cleanEmail := strings.TrimSpace(strings.ToLower(req.Email))
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		log.Println("❌ สุ่ม Token ล้มเหลว:", err)
	}
	sessionToken := fmt.Sprintf("up_sess_%s", hex.EncodeToString(b))

	// บันทึก Session Token ลง Redis มีอายุ 7 วัน
	redisSessionKey := fmt.Sprintf("upmatch:session:%s", sessionToken)
	config.RedisClient.Set(config.Ctx, redisSessionKey, cleanEmail, 7*24*time.Hour)

	// บันทึก Cookie ให้ทั้ง up_match_token และ upmatch_email
	c.Cookie(&fiber.Cookie{
		Name:     "up_match_token",
		Value:    sessionToken,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: false,
		SameSite: "Lax",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "upmatch_email",
		Value:    cleanEmail,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: false,
		SameSite: "Lax",
	})

	return c.Status(200).JSON(fiber.Map{
		"message": "ยืนยันตัวตนสำเร็จ!",
		"email":   cleanEmail,
		"token":   sessionToken,
	})
}