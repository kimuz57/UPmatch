package controllers

import (
	"encoding/json"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
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

func getMinProfilePhotos() int {
	if s := os.Getenv("MIN_PROFILE_PHOTOS"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n >= 1 {
			return n
		}
	}
	return 2
}

func getMaxProfilePhotos() int {
	if s := os.Getenv("MAX_PROFILE_PHOTOS"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n >= 1 {
			return n
		}
	}
	return 9
}

// บันทึกข้อมูลโปรไฟล์และอัปโหลดรูปภาพ (Multi-step complete)
func SaveProfile(c *fiber.Ctx) error {
	// ต้องผ่านการตรวจสอบ Session Token เท่านั้น ป้องกันการแอบอ้างสิทธิ์ของผู้อื่น
	email := GetCurrentUserEmail(c)
	if email == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: กรุณาเข้าสู่ระบบก่อนบันทึกโปรไฟล์"})
	}

	name := strings.TrimSpace(c.FormValue("name"))
	if name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "กรุณากรอกชื่อเล่นของคุณ (ช่องชื่อเป็นข้อมูลจำเป็น)"})
	}
	if len(name) < 2 || len(name) > 50 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ชื่อต้องมีความยาวระหว่าง 2 ถึง 50 ตัวอักษร"})
	}

	gender := strings.TrimSpace(c.FormValue("gender"))
	if gender == "" {
		gender = "ชาย"
	}
	preference := strings.TrimSpace(c.FormValue("preference"))
	if preference == "" {
		preference = "ทุกคน"
	}
	birthDateStr := c.FormValue("birth_date") // รูปแบบ "YYYY-MM-DD"
	caption := c.FormValue("caption")
	hobbies := c.FormValue("hobbies")
	mbti := c.FormValue("mbti")
	faculty := c.FormValue("faculty") // เพิ่มรับค่าคณะ
	heightStr := c.FormValue("height")
	height, _ := strconv.Atoi(strings.TrimSpace(heightStr))

	// แปลงวันเกิด
	birthDate, _ := time.Parse("2006-01-02", birthDateStr)

	// 1. ตรวจสอบสถานะว่ามีบัญชีเดิมในฐานข้อมูลอยู่แล้วหรือไม่
	var existingUser models.User
	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	userExists := config.DB.Where("LOWER(email) = ?", cleanEmail).First(&existingUser).Error == nil

	// 2. ตรวจสอบไฟล์รูปภาพล่วงหน้า (Pre-flight Validation) ป้องกันการสร้างข้อมูลค้างถ้าไฟล์รูปภาพไม่ผ่าน
	form, _ := c.MultipartForm()
	fileCount := 0
	if form != nil && form.File != nil {
		fileCount = len(form.File["images"])
	}

	photosManifestStr := strings.TrimSpace(c.FormValue("photos_manifest"))
	var manifest []PhotoManifestItem
	minPhotos := getMinProfilePhotos()
	maxPhotos := getMaxProfilePhotos()

	if photosManifestStr != "" {
		if err := json.Unmarshal([]byte(photosManifestStr), &manifest); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "รูปแบบรายการรูปภาพไม่ถูกต้อง"})
		}
		if len(manifest) < minPhotos {
			return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("บังคับมีรูปภาพอย่างน้อย %d รูปครับ", minPhotos)})
		}
		if len(manifest) > maxPhotos {
			return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("มีรูปภาพได้สูงสุด %d รูปครับ", maxPhotos)})
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
	} else {
		// Fallback (เช่น จากหน้า Onboarding หรือการอัปเดตแบบฟอร์มธรรมดา)
		if fileCount == 0 {
			if !userExists {
				return c.Status(400).JSON(fiber.Map{"error": "กรุณาอัปโหลดรูปภาพอย่างน้อย 2 รูปเพื่อสร้างโปรไฟล์"})
			}
			var imgCount int64
			config.DB.Model(&models.UserImage{}).Where("LOWER(user_email) = ?", cleanEmail).Count(&imgCount)
			if imgCount < 2 {
				return c.Status(400).JSON(fiber.Map{"error": "บังคับอัปโหลดรูปภาพอย่างน้อย 2 รูปครับ"})
			}
		} else if fileCount < 2 {
			if !userExists {
				return c.Status(400).JSON(fiber.Map{"error": "กรุณาอัปโหลดรูปภาพอย่างน้อย 2 รูปเพื่อสร้างโปรไฟล์"})
			}
		}
	}

	// 3. เริ่ม Database Transaction (ถ้าขั้นตอนใดผิดพลาด ข้อมูลจะไม่ถูกบันทึกลง Database เลย 100%)
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var user models.User
	if !userExists {
		// ผู้ใช้ใหม่: สร้าง User ใน Database เป็นครั้งแรก
		user = models.User{
			Email:        cleanEmail,
			Name:         name,
			AccountType:  "standard",
			IsPro:        false,
			ReferralCode: generateReferralCode(cleanEmail),
		}

		// ประมวลผล Referral Code (จาก Redis ที่เซฟไว้ตอน VerifyOTP หรือจากฟอร์ม)
		refKey := fmt.Sprintf("upmatch:referral:%s", cleanEmail)
		refCode, _ := config.RedisClient.Get(config.Ctx, refKey).Result()
		if refCode == "" {
			refCode = strings.TrimSpace(c.FormValue("referral_code"))
		}
		if refCode != "" {
			var referrer models.User
			if err := tx.Where("LOWER(referral_code) = ?", strings.ToLower(refCode)).First(&referrer).Error; err == nil {
				referrerEmail := strings.ToLower(strings.TrimSpace(referrer.Email))
				if referrerEmail != cleanEmail {
					user.ReferredBy = referrerEmail
					if !referrer.IsPro {
						referrer.IsPro = true
						referrer.AccountType = "pro"
						_ = tx.Save(&referrer).Error
						Hub.BroadcastProUpgrade(referrerEmail)
					}
				}
			}
			config.RedisClient.Del(config.Ctx, refKey)
		}

		if err := tx.Create(&user).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถสร้างโปรไฟล์ในฐานข้อมูลได้"})
		}
	} else {
		// ผู้ใช้เดิมที่มีโปรไฟล์อยู่แล้ว: อัปเดตชื่อ
		user = existingUser
		user.Name = name
		if user.ReferralCode == "" {
			user.ReferralCode = generateReferralCode(cleanEmail)
		}
		if err := tx.Save(&user).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถอัปเดตโปรไฟล์ในฐานข้อมูลได้"})
		}
	}

	userInfo := models.UserInfo{
		UserEmail:  cleanEmail,
		Caption:    caption,
		Hobbies:    hobbies,
		MBTI:       mbti,
		Height:     height,
		BirthDate:  birthDate,
		Gender:     gender,
		Preference: preference,
		Faculty:    faculty,
	}

	// Upsert UserInfo ภายใน Transaction
	if err := tx.Where(models.UserInfo{UserEmail: cleanEmail}).Assign(userInfo).FirstOrCreate(&userInfo).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถบันทึกข้อมูลส่วนตัวได้"})
	}

	// ติดตามรายการไฟล์ที่บันทึกลงดิสก์ใหม่ เพื่อลบทิ้งหาก Transaction ล้มเหลว
	var newlySavedDiskFiles []string

	// 4. บันทึกรูปภาพ
	if photosManifestStr != "" {
		// ดึงรายการรูปเก่า
		var oldImages []models.UserImage
		tx.Where("LOWER(user_email) = ?", cleanEmail).Find(&oldImages)

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

		// ลบเรคอร์ดรูปเก่าใน DB ทั้งหมดของผู้ใช้นี้ใน tx
		tx.Where("LOWER(user_email) = ?", cleanEmail).Delete(&models.UserImage{})

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
				filename := fmt.Sprintf("%s_%d_%d%s", cleanEmail, timestamp, i, ext)
				savePath := filepath.Join(config.UploadDir, filename)

				if err := c.SaveFile(file, savePath); err != nil {
					continue
				}
				newlySavedDiskFiles = append(newlySavedDiskFiles, savePath)
				imgURL = config.UploadURLPrefix + "/" + filename
			}

			if imgURL != "" {
				userImage := models.UserImage{
					UserEmail:    cleanEmail,
					ImageURL:     imgURL,
					DisplayOrder: i,
				}
				if err := tx.Create(&userImage).Error; err == nil {
					savedTotal++
				}
			}
		}

		if savedTotal < 2 {
			tx.Rollback()
			for _, f := range newlySavedDiskFiles {
				_ = os.Remove(f)
			}
			return c.Status(400).JSON(fiber.Map{"error": "บันทึกรูปภาพไม่สำเร็จ กรุณามีรูปภาพอย่างน้อย 2 รูป"})
		}

		if err := tx.Commit().Error; err != nil {
			for _, f := range newlySavedDiskFiles {
				_ = os.Remove(f)
			}
			return c.Status(500).JSON(fiber.Map{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูล"})
		}

		return c.JSON(fiber.Map{"message": "บันทึกและจัดลำดับรูปภาพสำเร็จ!"})
	}

	// === กรณีเดิมที่ไม่มี photos_manifest (Fallback) ===
	if fileCount == 0 {
		var imageCount int64
		tx.Model(&models.UserImage{}).Where("LOWER(user_email) = ?", cleanEmail).Count(&imageCount)
		if imageCount < 2 {
			tx.Rollback()
			return c.Status(400).JSON(fiber.Map{"error": "บังคับอัปโหลดรูปภาพอย่างน้อย 2 รูปครับ"})
		}

		if err := tx.Commit().Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูล"})
		}
		return c.JSON(fiber.Map{"message": "บันทึกข้อมูลส่วนตัวสำเร็จ!"})
	}

	files := form.File["images"]
	var oldImages []models.UserImage
	tx.Where("LOWER(user_email) = ?", cleanEmail).Find(&oldImages)
	tx.Where("LOWER(user_email) = ?", cleanEmail).Delete(&models.UserImage{})

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
			if rel != "" && rel != "/" {
				fullPath := filepath.Join(config.UploadDir, filepath.Clean(rel))
				_ = os.Remove(fullPath)
				continue
			}
		}
		_ = os.Remove(filepath.Join(config.UploadDir, filepath.Base(imgPath)))
	}

	timestamp := time.Now().Unix()
	savedCount := 0
	for i, file := range files {
		ext := strings.ToLower(filepath.Ext(file.Filename))
		filename := fmt.Sprintf("%s_%d_%d%s", cleanEmail, timestamp, i, ext)
		savePath := filepath.Join(config.UploadDir, filename)

		if err := c.SaveFile(file, savePath); err != nil {
			continue
		}
		newlySavedDiskFiles = append(newlySavedDiskFiles, savePath)

		userImage := models.UserImage{
			UserEmail:    cleanEmail,
			ImageURL:     config.UploadURLPrefix + "/" + filename,
			DisplayOrder: i,
		}
		if err := tx.Create(&userImage).Error; err != nil {
			continue
		}
		savedCount++
	}

	if savedCount < 2 {
		tx.Rollback()
		for _, f := range newlySavedDiskFiles {
			_ = os.Remove(f)
		}
		return c.Status(400).JSON(fiber.Map{"error": "บันทึกรูปภาพไม่สำเร็จ โปรดลองอีกครั้ง"})
	}

	if err := tx.Commit().Error; err != nil {
		for _, f := range newlySavedDiskFiles {
			_ = os.Remove(f)
		}
		return c.Status(500).JSON(fiber.Map{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูล"})
	}

	return c.JSON(fiber.Map{"message": "บันทึกข้อมูลและอัปโหลดรูปภาพสำเร็จ!"})
}
