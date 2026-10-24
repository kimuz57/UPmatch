package controllers

import (
	"encoding/json"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"upmatch-backend/config"
	"upmatch-backend/models"
)

type PhotoManifestItem struct {
	Type string `json:"type"` // "existing" หรือ "new"
	URL  string `json:"url"`  // สำหรับ existing
}

// บันทึกข้อมูลโปรไฟล์และอัปโหลดรูปภาพ (Multi-step complete)
func SaveProfile(c *fiber.Ctx) error {
	email := c.FormValue("email")
	name := c.FormValue("name")
	gender := c.FormValue("gender")
	preference := c.FormValue("preference")
	birthDateStr := c.FormValue("birth_date") // รูปแบบ "YYYY-MM-DD"
	caption := c.FormValue("caption")
	hobbies := c.FormValue("hobbies")
	mbti := c.FormValue("mbti")
	faculty := c.FormValue("faculty") // เพิ่มรับค่าคณะ

	// แปลงวันเกิด
	birthDate, _ := time.Parse("2006-01-02", birthDateStr)

	// 1. บันทึกหรืออัปเดตตาราง User และ UserInfo
	var user models.User
	if err := config.DB.First(&user, "email = ?", email).Error; err != nil {
		// ถ้ายังไม่มี User ให้สร้างใหม่
		user = models.User{Email: email, Name: name}
		config.DB.Create(&user)
	} else {
		// ถ้ามีแล้วให้อัปเดตชื่อ
		user.Name = name
		config.DB.Save(&user)
	}

	userInfo := models.UserInfo{
		UserEmail:  email,
		Caption:    caption,
		Hobbies:    hobbies,
		MBTI:       mbti,
		BirthDate:  birthDate,
		Gender:     gender,
		Preference: preference,
		Faculty:    faculty, // เพิ่มการอัปเดตคณะ
	}
	
	// Upsert UserInfo
	config.DB.Where(models.UserInfo{UserEmail: email}).Assign(userInfo).FirstOrCreate(&userInfo)

	// 2. จัดการอัปโหลดรูปภาพ
	form, _ := c.MultipartForm()
	fileCount := 0
	if form != nil && form.File != nil {
		fileCount = len(form.File["images"])
	}

	photosManifestStr := strings.TrimSpace(c.FormValue("photos_manifest"))

	// === กรณีที่ส่ง photos_manifest (ระบบจัดการ 9 ช่องแบบ Tinder) ===
	if photosManifestStr != "" {
		var manifest []PhotoManifestItem
		if err := json.Unmarshal([]byte(photosManifestStr), &manifest); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "รูปแบบรายการรูปภาพไม่ถูกต้อง"})
		}

		if len(manifest) < 2 {
			return c.Status(400).JSON(fiber.Map{"error": "บังคับมีรูปภาพอย่างน้อย 2 รูปครับ"})
		}
		if len(manifest) > 9 {
			return c.Status(400).JSON(fiber.Map{"error": "มีรูปภาพได้สูงสุด 9 รูปครับ"})
		}

		newCount := 0
		for _, item := range manifest {
			if item.Type == "new" {
				newCount++
			}
		}

		if newCount > fileCount {
			return c.Status(400).JSON(fiber.Map{"error": "จำนวนไฟล์รูปภาพใหม่ไม่ครบตามที่เลือก"})
		}

		// ดึงรายการรูปเก่า
		var oldImages []models.UserImage
		config.DB.Where("user_email = ?", email).Find(&oldImages)

		// แมปรูปที่ต้องการเก็บไว้
		keptBaseMap := make(map[string]string)
		for _, item := range manifest {
			if item.Type == "existing" && item.URL != "" {
				base := filepath.Base(item.URL)
				for _, old := range oldImages {
					if filepath.Base(old.ImageURL) == base {
						keptBaseMap[base] = old.ImageURL
						break
					}
				}
				if _, ok := keptBaseMap[base]; !ok {
					keptBaseMap[base] = item.URL
				}
			}
		}

		// ลบไฟล์ที่ไม่ถูกเก็บออกจากดิสก์
		for _, img := range oldImages {
			base := filepath.Base(img.ImageURL)
			if _, kept := keptBaseMap[base]; kept {
				continue
			}
			imgPath := img.ImageURL
			if imgPath == "" {
				continue
			}
			if filepath.IsAbs(imgPath) {
				_ = os.Remove(imgPath)
				continue
			}
			clean := filepath.Clean("/" + imgPath)
			if len(clean) > 1 && strings.HasPrefix(clean, config.UploadURLPrefix) {
				rel := strings.TrimPrefix(clean, config.UploadURLPrefix)
				if rel != "" && rel != "/" {
					fullPath := filepath.Join(config.UploadDir, filepath.Clean(rel))
					_ = os.Remove(fullPath)
					continue
				}
			}
			_ = os.Remove(filepath.Join(config.UploadDir, base))
		}

		// ลบเรคอร์ดรูปเก่าใน DB ทั้งหมดของผู้ใช้นี้
		config.DB.Where("user_email = ?", email).Delete(&models.UserImage{})

		// บันทึกรูปใหม่และจัดเรียง DisplayOrder ตาม manifest
		timestamp := time.Now().Unix()
		newFileIdx := 0
		var files []*multipart.FileHeader
		if form != nil && form.File != nil {
			files = form.File["images"]
		}

		savedTotal := 0
		for i, item := range manifest {
			var imgURL string
			if item.Type == "existing" {
				base := filepath.Base(item.URL)
				if origURL, ok := keptBaseMap[base]; ok {
					imgURL = origURL
				} else {
					imgURL = item.URL
				}
			} else if item.Type == "new" {
				if newFileIdx >= len(files) {
					continue
				}
				file := files[newFileIdx]
				newFileIdx++
				ext := strings.ToLower(filepath.Ext(file.Filename))
				filename := fmt.Sprintf("%s_%d_%d%s", email, timestamp, i, ext)
				savePath := filepath.Join(config.UploadDir, filename)

				if err := c.SaveFile(file, savePath); err != nil {
					continue
				}
				imgURL = config.UploadURLPrefix + "/" + filename
			}

			if imgURL != "" {
				userImage := models.UserImage{
					UserEmail:    email,
					ImageURL:     imgURL,
					DisplayOrder: i, // ลำดับ 0..8
				}
				if err := config.DB.Create(&userImage).Error; err == nil {
					savedTotal++
				}
			}
		}

		if savedTotal < 2 {
			return c.Status(400).JSON(fiber.Map{"error": "บันทึกรูปภาพไม่สำเร็จ กรุณามีรูปภาพอย่างน้อย 2 รูป"})
		}

		return c.JSON(fiber.Map{"message": "บันทึกและจัดลำดับรูปภาพสำเร็จ!"})
	}

	// === กรณีเดิมที่ไม่มี photos_manifest (Fallback) ===
	if fileCount == 0 {
		var imageCount int64
		config.DB.Model(&models.UserImage{}).Where("user_email = ?", email).Count(&imageCount)
		
		if imageCount < 2 {
			return c.Status(400).JSON(fiber.Map{"error": "บังคับอัปโหลดรูปภาพอย่างน้อย 2 รูปครับ"})
		}
		
		return c.JSON(fiber.Map{"message": "บันทึกข้อมูลส่วนตัวสำเร็จ!"})
	}

	if fileCount < 2 {
		return c.Status(400).JSON(fiber.Map{"error": "บังคับอัปโหลดรูปภาพอย่างน้อย 2 รูปครับ"})
	}

	files := form.File["images"]

	var oldImages []models.UserImage
	config.DB.Where("user_email = ?", email).Find(&oldImages)

	config.DB.Where("user_email = ?", email).Delete(&models.UserImage{})

	for _, img := range oldImages {
		imgPath := img.ImageURL
		if imgPath == "" {
			continue
		}
		if filepath.IsAbs(imgPath) {
			_ = os.Remove(imgPath)
			continue
		}
		clean := filepath.Clean("/" + imgPath)
		if len(clean) > 1 && strings.HasPrefix(clean, config.UploadURLPrefix) {
			rel := strings.TrimPrefix(clean, config.UploadURLPrefix)
			if rel == "" || rel == "/" {
				continue
			}
			fullPath := filepath.Join(config.UploadDir, filepath.Clean(rel))
			_ = os.Remove(fullPath)
			continue
		}
		_ = os.Remove(filepath.Join(config.UploadDir, filepath.Base(imgPath)))
	}

	timestamp := time.Now().Unix()
	savedCount := 0
	for i, file := range files {
		ext := strings.ToLower(filepath.Ext(file.Filename))
		filename := fmt.Sprintf("%s_%d_%d%s", email, timestamp, i, ext)
		savePath := filepath.Join(config.UploadDir, filename)

		if err := c.SaveFile(file, savePath); err != nil {
			continue
		}

		userImage := models.UserImage{
			UserEmail:    email,
			ImageURL:     config.UploadURLPrefix + "/" + filename,
			DisplayOrder: i,
		}
		if err := config.DB.Create(&userImage).Error; err != nil {
			_ = os.Remove(savePath)
			continue
		}
		savedCount++
	}

	if savedCount < 2 {
		return c.Status(400).JSON(fiber.Map{"error": "บันทึกรูปภาพไม่สำเร็จ โปรดลองอีกครั้ง"})
	}

	return c.JSON(fiber.Map{"message": "บันทึกข้อมูลและอัปโหลดรูปภาพสำเร็จ!"})
}
