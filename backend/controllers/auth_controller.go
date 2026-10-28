package controllers

import (
	"crypto/md5"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"

	"upmatch-backend/config" // นำเข้า config เพื่อใช้งาน RedisClient
	"upmatch-backend/models"
	"upmatch-backend/utils"
)

// บังคับรูปแบบอีเมลนิสิต ม.พะเยา รหัส 8 หลัก เช่น 67021589@up.ac.th
var upStudentEmailRegex = regexp.MustCompile(`^[0-9]{8}@up\.ac\.th$`)

func isValidUPEmail(email string) bool {
	return upStudentEmailRegex.MatchString(strings.ToLower(strings.TrimSpace(email)))
}

type OTPRequest struct {
	Email string `json:"email"`
	Year  int    `json:"year"`
}

type VerifyRequest struct {
	Email        string `json:"email"`
	OTP          string `json:"otp"`
	ReferralCode string `json:"referral_code"` // รหัสชวนเพื่อน (ถ้ามี)
}

func generateReferralCode(email string) string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	hash := md5.Sum([]byte(email + time.Now().String()))
	return fmt.Sprintf("REF_%s%s", hex.EncodeToString(b), hex.EncodeToString(hash[:2]))
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
	enableTest := strings.ToLower(os.Getenv("ENABLE_TEST_ACCOUNTS"))
	if enableTest != "true" {
		return false, ""
	}
	prefix := os.Getenv("TEST_ACCOUNT_PREFIX")
	otp := os.Getenv("TEST_ACCOUNT_OTP")
	if prefix == "" || otp == "" {
		return false, ""
	}
	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	if strings.HasPrefix(cleanEmail, strings.ToLower(prefix)) {
		return true, otp
	}
	return false, ""
}

func SendOTP(c *fiber.Ctx) error {
	var req OTPRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))
	if cleanEmail == "" {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณากรอกอีเมลนิสิต"})
	}

	// 1. ตรวจสอบเงื่อนไขอีเมลต้องเป็นนิสิต ม.พะเยา เท่านั้น (@up.ac.th 8 หลัก)
	if !isValidUPEmail(cleanEmail) {
		return c.Status(400).JSON(fiber.Map{
			"error": "ต้องใช้อีเมลนิสิต @up.ac.th ของมหาวิทยาลัยพะเยาเท่านั้น (เช่น 67021589@up.ac.th)",
		})
	}
	isTest, testOTP := checkTestAccount(cleanEmail)

	// 2. ป้องกัน Brute-force / Spam: Cooldown 60 วินาทีต่อ 1 บัญชี
	cooldownKey := fmt.Sprintf("upmatch:otp:cooldown:%s", cleanEmail)
	if exists, _ := config.RedisClient.Exists(config.Ctx, cooldownKey).Result(); exists > 0 {
		return c.Status(429).JSON(fiber.Map{
			"error": "คุณเพิ่งขอรหัส OTP ไป กรุณารอ 60 วินาทีก่อนขอใหม่อีกครั้ง",
		})
	}

	// 3. สุ่มรหัส OTP 6 หลัก
	otp := utils.GenerateOTP()
	otpExpiry := getOTPExpiry()

	// 4. บันทึก OTP ลง Redis
	redisKey := fmt.Sprintf("upmatch:otp:%s", cleanEmail)
	err := config.RedisClient.Set(config.Ctx, redisKey, otp, otpExpiry).Err()
	if err != nil {
		log.Println("❌ บันทึก Redis ล้มเหลว:", err)
		return c.Status(500).JSON(fiber.Map{"error": "ระบบขัดข้อง ไม่สามารถสร้างรหัส OTP ได้"})
	}
	_ = config.RedisClient.Set(config.Ctx, cooldownKey, "1", 60*time.Second).Err()
	log.Printf("✅ บันทึก OTP ลง Redis สำเร็จสำหรับอีเมล: %s (หมดอายุใน %v)", cleanEmail, otpExpiry)

	// สำหรับบัญชีทดสอบ (เฉพาะเมื่อเปิดใช้งานใน dev จริงๆ เท่านั้น)
	if isTest {
		_ = config.RedisClient.Set(config.Ctx, redisKey, testOTP, 24*time.Hour).Err()
		log.Printf("🧪 บัญชีทดสอบ %s เปิดใช้งาน", cleanEmail)
		return c.Status(200).JSON(fiber.Map{
			"message": "ส่งรหัส OTP เรียบร้อยแล้ว (โหมดทดสอบ)",
		})
	}

	// 5. ส่งอีเมลจริงผ่าน Gmail API
	err = utils.SendEmailOTPWithGmailAPI(cleanEmail, otp)
	if err != nil {
		config.RedisClient.Del(config.Ctx, redisKey) 
		config.RedisClient.Del(config.Ctx, cooldownKey)
		log.Println("❌ ส่งอีเมลล้มเหลว:", err)
		return c.Status(500).JSON(fiber.Map{
			"error": fmt.Sprintf("ไม่สามารถส่งอีเมลได้: %v", err),
		})
	}

	return c.Status(200).JSON(fiber.Map{
		"message": "ส่งรหัส OTP ไปที่อีเมล " + cleanEmail + " เรียบร้อยแล้ว",
	})
}

func VerifyOTP(c *fiber.Ctx) error {
	var req VerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "รูปแบบข้อมูลไม่ถูกต้อง"})
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))
	if cleanEmail == "" {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณากรอกอีเมลนิสิต"})
	}

	// ตรวจสอบเงื่อนไขอีเมลต้องเป็นนิสิต ม.พะเยา เท่านั้น
	if !isValidUPEmail(cleanEmail) {
		return c.Status(400).JSON(fiber.Map{
			"error": "ต้องใช้อีเมลนิสิต @up.ac.th ของมหาวิทยาลัยพะเยาเท่านั้น (เช่น 67021589@up.ac.th)",
		})
	}
	isTest, testOTP := checkTestAccount(cleanEmail)

	// 1. ดึง OTP จาก Redis ตามอีเมลที่ขอมา
	redisKey := fmt.Sprintf("upmatch:otp:%s", cleanEmail)
	savedOTP, err := config.RedisClient.Get(config.Ctx, redisKey).Result()
	
	if isTest && req.OTP == testOTP {
		savedOTP = testOTP
		err = nil
	} else if err == redis.Nil {
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

	// 5. ตรวจสอบสถานะบัญชีใน Database (จะไม่สร้างหรือบันทึกลง Database จนกว่าจะตั้งค่าโปรไฟล์และอัปโหลดรูปเสร็จสมบูรณ์)
	var user models.User
	userExists := config.DB.Where("LOWER(email) = ?", cleanEmail).First(&user).Error == nil

	// เก็บ Referral Code ไว้ใน Redis ชั่วคราว (จะนำไปใช้เมื่อผู้ใช้ตั้งค่าโปรไฟล์เสร็จใน SaveProfile)
	cleanRef := strings.TrimSpace(req.ReferralCode)
	if cleanRef != "" && (!userExists || user.ReferredBy == "") {
		refKey := fmt.Sprintf("upmatch:referral:%s", cleanEmail)
		_ = config.RedisClient.Set(config.Ctx, refKey, cleanRef, sessionDuration).Err()
	}

	return c.Status(200).JSON(fiber.Map{
		"message":       "ยืนยันตัวตนสำเร็จ!",
		"email":         cleanEmail,
		"token":         sessionToken,
		"is_new_user":   !userExists,
		"is_pro":        user.IsPro,
		"account_type":  user.AccountType,
		"referral_code": user.ReferralCode,
	})
}