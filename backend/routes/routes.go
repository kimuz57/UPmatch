// backend/routes/routes.go
package routes

import (
	"github.com/gofiber/fiber/v2"
	"upmatch-backend/controllers" // ⚠️ เช็กชื่อโมดูลใน go.mod ให้ตรงกัน
)

func SetupRoutes(app *fiber.App) {
	// กลุ่มหลัก /api/v1
	api := app.Group("/api/v1")
	{
		// 1. กลุ่มระบบสมาชิก / บัญชี (Auth)
		auth := api.Group("/auth")
		{
			auth.Post("/send-otp", controllers.SendOTP)
			auth.Post("/verify-otp", controllers.VerifyOTP)
		}
        
		// ✅ เปลี่ยนจาก app เป็น api ตรง 2 บรรทัดนี้
		api.Post("/swipe", controllers.HandleSwipe)
		api.Get("/who-likes-me", controllers.GetWhoLikesMe)
        
		// 2. กลุ่มจัดการโปรไฟล์และรูปภาพ
		api.Post("/profile", controllers.SaveProfile)
		api.Get("/feed", controllers.GetFeed)       // สำหรับหน้า /swipe
		api.Get("/me", controllers.GetMe)           // สำหรับหน้า /profile
		api.Get("/user/:email", controllers.GetUserProfile) // สำหรับกดดูโปรไฟล์คนอื่น
		api.Get("/matches", controllers.GetMatches) // สำหรับหน้า /matches
		api.Get("/chats", controllers.GetChats)     // สำหรับหน้า /chat
		api.Get("/chat/sse", controllers.ChatSSE)   // Realtime Server-Sent Events (SSE)
		api.Get("/chat/:target_email", controllers.GetChatMessages)
		api.Post("/chat/send", controllers.SendMessage)
		api.Post("/chat/unmatch", controllers.Unmatch)
		api.Get("/notifications/unread-count", controllers.GetUnreadCounts)
		api.Get("/notifications/vapid-key", controllers.GetVapidPublicKey)
		api.Post("/notifications/push-subscribe", controllers.SubscribePush)
	}
}