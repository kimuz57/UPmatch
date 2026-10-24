package controllers

import (
	"os"
	"strings"
	"time"
	"upmatch-backend/config"
	"upmatch-backend/models"

	"github.com/gofiber/fiber/v2"
)

// 1. ส่ง VAPID Public Key ให้ Frontend นำไปใช้ Subscribe Push
func GetVapidPublicKey(c *fiber.Ctx) error {
	publicKey := os.Getenv("VAPID_PUBLIC_KEY")
	return c.JSON(fiber.Map{
		"public_key": publicKey,
	})
}

type PushSubscribeRequest struct {
	Email        string `json:"email"`
	Subscription struct {
		Endpoint string `json:"endpoint"`
		Keys     struct {
			P256dh string `json:"p256dh"`
			Auth   string `json:"auth"`
		} `json:"keys"`
	} `json:"subscription"`
}

// 2. บันทึก Push Subscription สำหรับส่งแจ้งเตือนตอนพับหน้าจอ/ปิดบราวเซอร์
func SubscribePush(c *fiber.Ctx) error {
	myEmail := ResolveEmail(GetCurrentUserEmail(c))
	var req PushSubscribeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	if myEmail == "" && req.Email != "" {
		myEmail = ResolveEmail(req.Email)
	}
	cleanEmail := strings.ToLower(strings.TrimSpace(myEmail))

	endpoint := strings.TrimSpace(req.Subscription.Endpoint)
	p256dh := strings.TrimSpace(req.Subscription.Keys.P256dh)
	auth := strings.TrimSpace(req.Subscription.Keys.Auth)

	if cleanEmail == "" || endpoint == "" || p256dh == "" || auth == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ข้อมูล Subscription ไม่ครบถ้วน"})
	}

	var sub models.PushSubscription
	if err := config.DB.Where("endpoint = ?", endpoint).First(&sub).Error; err == nil && sub.ID > 0 {
		sub.Email = cleanEmail
		sub.P256dh = p256dh
		sub.Auth = auth
		sub.UpdatedAt = time.Now()
		config.DB.Save(&sub)
	} else {
		sub = models.PushSubscription{
			Email:     cleanEmail,
			Endpoint:  endpoint,
			P256dh:    p256dh,
			Auth:      auth,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		config.DB.Create(&sub)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "ลงทะเบียนรับการแจ้งเตือนสำเร็จ",
	})
}
