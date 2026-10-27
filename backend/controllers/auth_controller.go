package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"strconv"
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

func getSessionCookieName() string {
	if name := os.Getenv("SESSION_COOKIE_NAME"); name != "" {
		return name
	}
	return "up_match_token"
}

func getEmailCookieName() string {
	if name := os.Getenv("SESSION_EMAIL_COOKIE_NAME"); name != "" {
		return name
	}
	return "upmatch_email"
}

func getSessionTokenPrefix() string {
	if prefix := os.Getenv("SESSION_TOKEN_PREFIX"); prefix != "" {
		return prefix
	}
	return "up_sess_"
}

func getSessionDuration() time.Duration {
	if daysStr := os.Getenv("SESSION_DURATION_DAYS"); daysStr != "" {
		if days, err := strconv.Atoi(daysStr); err == nil && days > 0 {
			return time.Duration(days) * 24 * time.Hour
		}
	}
	return 7 * 24 * time.Hour
}

func getOTPExpiry() time.Duration {
	if minStr := os.Getenv("OTP_EXPIRY_MINUTES"); minStr != "" {
		if mins, err := strconv.Atoi(minStr); err == nil && mins > 0 {
			return time.Duration(mins) * time.Minute
		}
	}
	return 5 * time.Minute
}

func checkTestAccount(email string) (bool, string) {
	enableTest := os.Getenv("ENABLE_TEST_ACCOUNTS")
	if enableTest == "false" || enableTest == "0" {
		return false, ""
	}
	prefix := os.Getenv("TEST_ACCOUNT_PREFIX")
	if prefix == "" {
		prefix = "123"
	}
	otp := os.Getenv("TEST_ACCOUNT_OTP")
	if otp == "" {
		otp = "123456"
	}
	if strings.HasPrefix(email, prefix) {
		return true, otp
	}
	return false, ""
}

func SendOTP(c *fiber.Ctx) error {
	var req OTPRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
	}

	// 1. สุ่มรหัส OTP 6 หลัก
	otp := utils.GenerateOTP()
	otpExpiry := getOTPExpiry()

	// 2. บันทึก OTP ลง Redis พร้อมตั้งเวลาหมดอายุจาก env
	redisKey := fmt.Sprintf("upmatch:otp:%s", req.Email)
	err := config.RedisClient.Set(config.Ctx, redisKey, otp, otpExpiry).Err()
	if err != nil {
		log.Println("❌ บันทึก Redis ล้มเหลว:", err)
		return c.Status(500).JSON(fiber.Map{"error": "ระบบขัดข้อง ไม่สามารถสร้างรหัส OTP ได้"})
	}
	log.Printf("✅ บันทึก OTP ลง Redis สำเร็จ: %s สำหรับอีเมล: %s (หมดอายุใน %v)", otp, req.Email, otpExpiry)

	// สำหรับบัญชีทดสอบที่เปิดใช้งานผ่าน .env
	if isTest, testOTP := checkTestAccount(req.Email); isTest {
		_ = config.RedisClient.Set(config.Ctx, redisKey, testOTP, 24*time.Hour).Err()
		log.Printf("🧪 บัญชีทดสอบ %s: ใช้ OTP %s", req.Email, testOTP)
		return c.Status(200).JSON(fiber.Map{
			"message": fmt.Sprintf("รหัส OTP ทดสอบคือ %s", testOTP),
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
	
	if isTest, testOTP := checkTestAccount(req.Email); isTest && req.OTP == testOTP {
		savedOTP = testOTP
		err = nil
	} else if err == redis.Nil {
		// หา key ไม่เจอ = รหัสหมดอายุไปแล้ว หรืออีเมลนี้ยังไม่ได้กดขอ OTP
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
	sessionToken := fmt.Sprintf("%s%s", getSessionTokenPrefix(), hex.EncodeToString(b))
	sessionDuration := getSessionDuration()

	// บันทึก Session Token ลง Redis
	redisSessionKey := fmt.Sprintf("upmatch:session:%s", sessionToken)
	config.RedisClient.Set(config.Ctx, redisSessionKey, cleanEmail, sessionDuration)

	// บันทึก Cookie ตามชื่อที่คอนฟิกใน .env
	c.Cookie(&fiber.Cookie{
		Name:     getSessionCookieName(),
		Value:    sessionToken,
		Expires:  time.Now().Add(sessionDuration),
		HTTPOnly: false,
		SameSite: "Lax",
	})
	c.Cookie(&fiber.Cookie{
		Name:     getEmailCookieName(),
		Value:    cleanEmail,
		Expires:  time.Now().Add(sessionDuration),
		HTTPOnly: false,
		SameSite: "Lax",
	})

	return c.Status(200).JSON(fiber.Map{
		"message": "ยืนยันตัวตนสำเร็จ!",
		"email":   cleanEmail,
		"token":   sessionToken,
	})
}