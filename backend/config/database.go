package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	
	// แก้ "backend" ให้ตรงกับชื่อโมดูลของคุณ
	"upmatch-backend/models" 
)

var DB *gorm.DB

func ConnectDatabase() {
	// โหลดไฟล์ .env
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ ไม่พบไฟล์ .env หรือโหลดไม่สำเร็จ (อาจจะดึงจาก Environment ของระบบแทน)")
	}

	// สร้าง DSN String ดึงค่าตัวแปรจาก .env
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Bangkok",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)
	
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect to database:", err)
	}

	log.Println("🔥 Connected to PostgreSQL successfully! (ผ่าน .env)")

	// สร้าง Schema public เผื่อกรณีผู้ใช้ลบ Schema public ทิ้ง
	database.Exec("CREATE SCHEMA IF NOT EXISTS public")

	err = database.AutoMigrate(
		&models.User{},
		&models.UserInfo{},
		&models.UserImage{},
		&models.Like{},
		&models.Match{},
		&models.Message{},
		&models.Pass{},
		&models.Report{},
		&models.PushSubscription{},
	)
	if err != nil {
		log.Fatal("❌ Failed to migrate database:", err)
	}
	
	log.Println("✅ Database Migrated successfully!")
	
	DB = database
}