// backend/config/redis.go
package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var Ctx = context.Background()

func ConnectRedis() {
	host := os.Getenv("REDIS_HOST")
	port := os.Getenv("REDIS_PORT")
	password := os.Getenv("REDIS_PASSWORD")
	dbStr := os.Getenv("REDIS_DB")

	// แปลง DB จาก string เป็น int (ถ้าไม่ได้ตั้งค่าไว้จะใช้ 0)
	db, _ := strconv.Atoi(dbStr)

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
		DB:       db,
	})

	// ทดสอบการเชื่อมต่อ
	_, err := RedisClient.Ping(Ctx).Result()
	if err != nil {
		log.Fatal("❌ Failed to connect to Redis:", err)
	}

	log.Println("🔥 Connected to Redis successfully!")
}