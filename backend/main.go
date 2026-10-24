// backend/main.go
package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"

	"upmatch-backend/config"
	"upmatch-backend/routes" // ⚠️ นำเข้าแพ็กเกจ routes ที่เราเพิ่งสร้าง
)

func main() {
	// โหลดไฟล์ .env
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ ไม่พบไฟล์ .env ระบบอาจจะส่งอีเมลไม่ได้")
	}

	// เชื่อมต่อฐานข้อมูลและ Redis
	config.ConnectRedis()
	config.ConnectDatabase()
	
	// กำหนดและสร้างโฟลเดอร์ uploads ให้มีเส้นทางที่ชัดเจนและคงที่
	config.InitUploadDir()

	app := fiber.New()

	// Middleware พื้นฐาน
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOriginsFunc: func(origin string) bool {
			// อนุญาตทุก Origin ในการพัฒนาวง LAN เช่น localhost, 127.0.0.1, 192.168.*
			return true
		},
		AllowOrigins:     "http://localhost:3003, http://127.0.0.1:3003, http://192.168.1.109:3003",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-User-Email",
		AllowCredentials: true,
	}))

	// เปิดให้เข้าถึงโฟลเดอร์รูปภาพแบบ Static (ใช้เส้นทาง absolute ที่ resolve แล้ว)
	app.Static(config.UploadURLPrefix, config.UploadDir)

	// เรียกใช้งาน Routes ทั้งหมดที่เราแยกไว้
	routes.SetupRoutes(app)

	// รันเซิร์ฟเวอร์
	log.Println("🚀 Backend พร้อมทำงานที่ http://localhost:8080")
	log.Fatal(app.Listen(":8080"))
}