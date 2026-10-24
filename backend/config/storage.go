package config

import (
	"log"
	"os"
	"path/filepath"
)

var UploadDir string

const UploadURLPrefix = "/uploads"

func InitUploadDir() {
	dir, err := filepath.Abs("./uploads")
	if err != nil {
		log.Fatal("❌ Failed to resolve uploads directory:", err)
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		log.Fatal("❌ Failed to create uploads directory:", err)
	}
	UploadDir = dir
}
