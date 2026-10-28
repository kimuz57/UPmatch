// backend/controllers/feed_controller.go
package controllers

import (
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
	"upmatch-backend/config"
	"upmatch-backend/models"

	"github.com/gofiber/fiber/v2"
)

func getDefaultAvatar() string {
	if avatar := os.Getenv("DEFAULT_AVATAR_URL"); avatar != "" {
		return avatar
	}
	return "/logo.png"
}

// โครงสร้างข้อมูลโปรไฟล์ที่ดึงจาก Database
type profileRow struct {
	UserEmail  string
	Caption    string
	Hobbies    string
	MBTI       string
	Height     int
	BirthDate  time.Time
	Gender     string
	Preference string
	Faculty    string
}

func parseAnyDate(val interface{}) time.Time {
	if val == nil {
		return time.Time{}
	}
	switch v := val.(type) {
	case time.Time:
		return v
	case string:
		return parseDateString(v)
	case []byte:
		return parseDateString(string(v))
	default:
		return parseDateString(fmt.Sprintf("%v", v))
	}
}

func parseDateString(s string) time.Time {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}
	}
	layouts := []string{
		time.RFC3339,
		"2006-01-02 15:04:05.999 -0700",
		"2006-01-02 15:04:05.999999-07",
		"2006-01-02 15:04:05-07",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t
		}
	}
	if len(s) >= 10 {
		if t, err := time.Parse("2006-01-02", s[:10]); err == nil {
			return t
		}
	}
	return time.Time{}
}

func getProfileByEmail(email string) profileRow {
	var p profileRow
	var info models.UserInfo
	if err := config.DB.Where("user_email = ?", email).First(&info).Error; err == nil {
		p.Caption = info.Caption
		p.Hobbies = info.Hobbies
		p.MBTI = info.MBTI
		p.Height = info.Height
		p.Gender = info.Gender
		p.Preference = info.Preference
		p.Faculty = info.Faculty
		p.BirthDate = info.BirthDate
		return p
	}

	tables := []string{"user_profiles", "profiles", "users"}
	for _, tbl := range tables {
		var result map[string]interface{}
		col := "user_email"
		if tbl == "users" {
			col = "email"
		}
		err := config.DB.Table(tbl).Where(col+" = ?", email).Take(&result).Error
		if err == nil && len(result) > 0 {
			if v, ok := result["caption"].(string); ok && p.Caption == "" {
				p.Caption = v
			}
			if v, ok := result["hobbies"].(string); ok && p.Hobbies == "" {
				p.Hobbies = v
			}
			if v, ok := result["mbti"].(string); ok && p.MBTI == "" {
				p.MBTI = v
			}
			if v, ok := result["gender"].(string); ok && p.Gender == "" {
				p.Gender = v
			}
			if v, ok := result["preference"].(string); ok && p.Preference == "" {
				p.Preference = v
			}
			if v, ok := result["faculty"].(string); ok && p.Faculty == "" {
				p.Faculty = v
			}
			if v, ok := result["birth_date"]; ok && v != nil && p.BirthDate.IsZero() {
				p.BirthDate = parseAnyDate(v)
			}
		}
	}
	return p
}

// normalizeGender จัดการข้อความเพศให้เป็นมาตรฐาน ("ชาย", "หญิง", "LGBTQ+")
func normalizeGender(g string) string {
	g = strings.TrimSpace(g)
	if strings.Contains(g, "หญิง") || strings.EqualFold(g, "female") || strings.EqualFold(g, "f") {
		return "หญิง"
	}
	if strings.Contains(g, "ชาย") || strings.EqualFold(g, "male") || strings.EqualFold(g, "m") {
		return "ชาย"
	}
	return g
}

// normalizePreference จัดการข้อความความสนใจให้เป็นมาตรฐาน ("ชาย", "หญิง", "ทุกคน")
func normalizePreference(p string) string {
	p = strings.TrimSpace(p)
	if p == "" || p == "ทุกคน" || p == "ทั้งหมด" || strings.EqualFold(p, "all") || strings.EqualFold(p, "everyone") {
		return "ทุกคน"
	}
	if strings.Contains(p, "หญิง") || strings.EqualFold(p, "female") {
		return "หญิง"
	}
	if strings.Contains(p, "ชาย") || strings.EqualFold(p, "male") {
		return "ชาย"
	}
	return p
}

func formatImageURL(path string) string {
	if path == "" {
		return getDefaultAvatar()
	}
	// ถ้ามี domain หรือ localhost พ่วงมากับ /uploads ให้ตัดออกเป็น relative path
	if idx := strings.Index(path, "/uploads/"); idx != -1 {
		return path[idx:]
	}
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return path
}

func firstImageURL(images []models.UserImage) string {
	if len(images) == 0 {
		return getDefaultAvatar()
	}
	main := images[0]
	for _, img := range images {
		if img.DisplayOrder == 0 {
			main = img
			break
		}
	}
	path := main.ImageURL
	if path == "" {
		return getDefaultAvatar()
	}
	check := path
	if !filepath.IsAbs(check) {
		clean := filepath.Clean("/" + path)
		if strings.HasPrefix(clean, config.UploadURLPrefix) {
			rel := strings.TrimPrefix(clean, config.UploadURLPrefix)
			if rel != "" && rel != "/" {
				check = filepath.Join(config.UploadDir, filepath.Clean(rel))
			} else {
				check = filepath.Join(config.UploadDir, filepath.Base(path))
			}
		} else {
			check = filepath.Join(config.UploadDir, filepath.Base(path))
		}
	}
	if _, err := os.Stat(check); err == nil {
		return formatImageURL(path)
	}
	return formatImageURL(path)
}

func calculateAge(birthDate time.Time) int {
	if birthDate.IsZero() || birthDate.Year() <= 1900 {
		return 0
	}
	now := time.Now()
	age := now.Year() - birthDate.Year()
	if now.Month() < birthDate.Month() || (now.Month() == birthDate.Month() && now.Day() < birthDate.Day()) {
		age--
	}
	return age
}

// GetCurrentUserEmail ตรวจสอบและดึง email ผู้ใช้จริงจาก Session Token ใน Redis
// ป้องกันการปลอมแปลงอีเมลผ่าน Header, Query หรือ Cookie โดยเด็ดขาด
func GetCurrentUserEmail(c *fiber.Ctx) string {
	token := ""

	// 1. ดึง Token จาก Authorization Header: Bearer <token>
	auth := c.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		token = strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
	}

	// 2. ดึง Token จาก Cookie up_match_token หรือ token
	if token == "" {
		token = strings.TrimSpace(c.Cookies("up_match_token"))
	}
	if token == "" {
		token = strings.TrimSpace(c.Cookies("token"))
	}

	// 3. ดึง Token จาก Query token (สำหรับ SSE / EventSource)
	if token == "" {
		token = strings.TrimSpace(c.Query("token"))
	}

	// 4. ดึง Token จาก FormValue token (สำหรับ Multipart FormData)
	if token == "" {
		token = strings.TrimSpace(c.FormValue("token"))
	}

	// 5. ตรวจสอบความถูกต้องของ Token กับ Redis Session Store
	if token != "" && config.RedisClient != nil {
		redisSessionKey := fmt.Sprintf("upmatch:session:%s", token)
		if email, err := config.RedisClient.Get(config.Ctx, redisSessionKey).Result(); err == nil && email != "" {
			return strings.ToLower(strings.TrimSpace(email))
		}
	}

	return ""
}

// 1. ดึงข้อมูลโปรไฟล์ของตัวเอง
func GetMe(c *fiber.Ctx) error {
	email := GetCurrentUserEmail(c)
	if email == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var user models.User
	if err := config.DB.Preload("Images").Where("LOWER(email) = ?", email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"profile": nil,
			"is_new":  true,
		})
	}

	prof := getProfileByEmail(user.Email)
	age := calculateAge(prof.BirthDate)

	// เรียงลำดับรูปภาพตาม DisplayOrder อย่างเคร่งครัด
	sortedImages := make([]models.UserImage, len(user.Images))
	copy(sortedImages, user.Images)
	sort.Slice(sortedImages, func(i, j int) bool {
		return sortedImages[i].DisplayOrder < sortedImages[j].DisplayOrder
	})

	var allImages []string
	for _, img := range sortedImages {
		if img.ImageURL != "" {
			allImages = append(allImages, formatImageURL(img.ImageURL))
		}
	}
	imageURL := firstImageURL(sortedImages)

	birthDateStr := ""
	if !prof.BirthDate.IsZero() {
		birthDateStr = prof.BirthDate.Format("2006-01-02")
	}

	faculty := strings.TrimSpace(prof.Faculty)
	if faculty == "-" {
		faculty = ""
	}

	return c.JSON(fiber.Map{
		"profile": fiber.Map{
			"name":       user.Name,
			"age":        age,
			"birth_date": birthDateStr,
			"faculty":    faculty,
			"gender":     prof.Gender,
			"preference": prof.Preference,
			"caption":    prof.Caption,
			"hobbies":    prof.Hobbies,
			"mbti":       prof.MBTI,
			"height":     prof.Height,
			"image":      imageURL,
			"images":        allImages,
			"email":         user.Email,
			"is_pro":        user.IsPro,
			"account_type":  user.AccountType,
			"referral_code": user.ReferralCode,
		},
	})
}

// 2. ดึงรายการเพื่อนสำหรับหน้า Swipe (กรองตัวเอง, กรองคนที่กดแล้วออก, คัดตาม Preference)
func GetFeed(c *fiber.Ctx) error {
	myEmail := GetCurrentUserEmail(c)
	if myEmail == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized: กรุณาเข้าสู่ระบบ"})
	}

	// 1. ดึงโปรไฟล์ตัวเอง เพื่อดู Gender และ Preference (เพศที่สนใจ)
	myProf := getProfileByEmail(myEmail)
	myGender := normalizeGender(myProf.Gender)
	if myGender == "" {
		myGender = normalizeGender(c.Query("gender"))
	}
	myPref := normalizePreference(myProf.Preference)
	if (myPref == "ทุกคน" || myPref == "") && c.Query("preference") != "" {
		myPref = normalizePreference(c.Query("preference"))
	}

	// 2. สร้าง Map ไว้เก็บ Email ที่ "ห้ามแสดง" เพื่อป้องกันข้อมูลซ้ำซ้อน
	excludedMap := make(map[string]bool)
	cleanMyEmail := strings.ToLower(strings.TrimSpace(myEmail))
	excludedMap[cleanMyEmail] = true // ซ่อนตัวเอง
	excludedMap[myEmail] = true

	// รองรับ exclude เพิ่มเติมจาก Client (เช่น คนที่โหลดไว้ใน Cache หน้าบ้านแล้ว)
	if extraExcludes := c.Query("exclude"); extraExcludes != "" {
		for _, exc := range strings.Split(extraExcludes, ",") {
			exc = strings.TrimSpace(exc)
			if exc != "" {
				excludedMap[strings.ToLower(exc)] = true
				excludedMap[exc] = true
			}
		}
	}

	// 3. ดึงคนที่เคย Like ไปแล้ว
	var likedIds []string
	config.DB.Model(&models.Like{}).Where("LOWER(liker_id) = ?", cleanMyEmail).Pluck("liked_id", &likedIds)
	for _, id := range likedIds {
		id = strings.TrimSpace(id)
		if id != "" {
			excludedMap[strings.ToLower(id)] = true
			excludedMap[id] = true
		}
	}

	// 4. ดึงคนที่เคย Pass (ปัดซ้าย) ไปแล้ว
	var passedIds []string
	config.DB.Model(&models.Pass{}).Where("LOWER(passer_id) = ?", cleanMyEmail).Pluck("passed_id", &passedIds)
	for _, id := range passedIds {
		id = strings.TrimSpace(id)
		if id != "" {
			excludedMap[strings.ToLower(id)] = true
			excludedMap[id] = true
		}
	}

	// 5. ดึงคนที่ Match กันไปแล้ว
	var matches []models.Match
	config.DB.Where("LOWER(user1_id) = ? OR LOWER(user2_id) = ?", cleanMyEmail, cleanMyEmail).Find(&matches)
	for _, m := range matches {
		if !strings.EqualFold(m.User1ID, cleanMyEmail) {
			excludedMap[strings.ToLower(m.User1ID)] = true
			excludedMap[m.User1ID] = true
		}
		if !strings.EqualFold(m.User2ID, cleanMyEmail) {
			excludedMap[strings.ToLower(m.User2ID)] = true
			excludedMap[m.User2ID] = true
		}
	}

	// 6. แปลง Map เป็น Array เพื่อนำไปใช้กับ Query NOT IN
	var excludedEmails []string
	for email := range excludedMap {
		if email != "" {
			excludedEmails = append(excludedEmails, email)
		}
	}

	// 7. ค้นหา User ทั้งหมดที่ไม่อยู่ใน excludedEmails พร้อมสุ่มด้วย RANDOM()
	var users []models.User
	query := config.DB.Preload("Images").Where("TRIM(name) != '' AND name IS NOT NULL").Order("RANDOM()")
	if len(excludedEmails) > 0 {
		query = query.Where("LOWER(email) NOT IN ?", excludedEmails)
	}

	if err := query.Find(&users).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ไม่สามารถดึงข้อมูลฟีดได้"})
	}

	// 8. จัดเตรียมข้อมูลส่งให้ Frontend (คัดกรองตามเพศที่สนใจ / Preference แบบสองทิศทาง Mutual Match)
	profiles := []fiber.Map{}
	for _, u := range users {
		if strings.TrimSpace(u.Name) == "" {
			continue
		}

		// 1) คัดกรองรูปภาพ: ต้องมีรูปภาพจริงที่ผู้ใช้อัปโหลดอย่างน้อย 1 รูป ห้ามนำ Default Avatar/Stock Image มาขึ้นหน้า Swipe
		var allImages []string
		sortedImages := make([]models.UserImage, len(u.Images))
		copy(sortedImages, u.Images)
		sort.Slice(sortedImages, func(i, j int) bool {
			return sortedImages[i].DisplayOrder < sortedImages[j].DisplayOrder
		})
		for _, img := range sortedImages {
			cleanImg := strings.TrimSpace(img.ImageURL)
			if cleanImg != "" && !strings.Contains(cleanImg, "unsplash.com") && cleanImg != "/placeholder.jpg" && cleanImg != "/logo.png" {
				allImages = append(allImages, formatImageURL(cleanImg))
			}
		}
		if len(allImages) == 0 {
			continue // ไม่มีรูปจริง ข้ามไปเลย
		}
		imageURL := allImages[0]

		prof := getProfileByEmail(u.Email)
		targetGender := normalizeGender(prof.Gender)
		targetPref := normalizePreference(prof.Preference)

		// 2) กรองตามความสนใจของเรา: ถ้าเราอยากเจอแค่ "หญิง" หรือ "ชาย" เพศของเป้าหมายต้องตรงกับที่เราต้องการ
		if myPref != "ทุกคน" && myPref != "" {
			if targetGender != "" && targetGender != myPref {
				continue // เพศของเป้าหมายไม่ตรงกับความสนใจของเรา -> ข้าม
			}
		}

		// 3) กรองตามความสนใจของเป้าหมาย (Mutual Match): เพศของเราต้องตรงกับที่เป้าหมายต้องการ (หรือเป้าหมายสนใจ "ทุกคน")
		if targetPref != "ทุกคน" && targetPref != "" {
			if myGender != "" && myGender != targetPref {
				continue // เพศของเราไม่ตรงกับความสนใจของเป้าหมาย -> ข้าม
			}
		}

		age := calculateAge(prof.BirthDate)

		birthDateStr := ""
		if !prof.BirthDate.IsZero() {
			birthDateStr = prof.BirthDate.Format("2006-01-02")
		}

		faculty := strings.TrimSpace(prof.Faculty)
		if faculty == "-" {
			faculty = ""
		}

		profiles = append(profiles, fiber.Map{
			"id":             u.Email,
			"name":           u.Name,
			"age":            age,
			"birth_date":     birthDateStr,
			"faculty":        faculty,
			"bio":            prof.Caption,
			"caption":        prof.Caption,
			"hobbies":        prof.Hobbies,
			"mbti":           prof.MBTI,
			"height":         prof.Height,
			"gender":         prof.Gender,
			"preference":     prof.Preference,
			"promptQuestion": "แคปชั่น / แนะนำตัว",
			"promptAnswer":   prof.Caption,
			"image":          imageURL,
			"images":         allImages,
		})
	}

	// 9. True Random Shuffle ใน Memory เพื่อความสุ่มกระจายตัวสมบูรณ์แบบ
	if len(profiles) > 1 {
		r := rand.New(rand.NewSource(time.Now().UnixNano()))
		r.Shuffle(len(profiles), func(i, j int) {
			profiles[i], profiles[j] = profiles[j], profiles[i]
		})
	}

	// 10. ถ้ามีการส่ง limit มา ให้ส่งตามจำนวนที่ขอ (เช่น โหลดล่วงหน้าครั้งละ 10 คน)
	limit := c.QueryInt("limit", 0)
	if limit > 0 && len(profiles) > limit {
		profiles = profiles[:limit]
	}

	return c.JSON(fiber.Map{"profiles": profiles})
}

// 3. ดึงรายการ Matches จาก Database (เตรียมไว้สำหรับหน้า Match)
func GetMatches(c *fiber.Ctx) error {
	myEmail := GetCurrentUserEmail(c)
	if myEmail == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var matches []models.Match
	config.DB.Where("user1_id = ? OR user2_id = ?", myEmail, myEmail).Find(&matches)

	matchedList := []fiber.Map{}
	for _, m := range matches {
		targetEmail := m.User1ID
		if targetEmail == myEmail {
			targetEmail = m.User2ID
		}

		var user models.User
		if err := config.DB.Preload("Images").Where("email = ?", targetEmail).First(&user).Error; err == nil {
			prof := getProfileByEmail(user.Email)
			h := HashEmail(user.Email)
			matchedList = append(matchedList, fiber.Map{
				"id":    h,
				"hash":  h,
				"name":  user.Name,
				"image": firstImageURL(user.Images),
				"bio":   prof.Caption,
			})
		}
	}

	return c.JSON(fiber.Map{"matches": matchedList})
}

// 4. ดึงข้อมูลโปรไฟล์สาธารณะ (สำหรับกดดูโปรไฟล์)
func GetUserProfile(c *fiber.Ctx) error {
	rawTarget := strings.TrimSpace(c.Params("email"))
	if rawTarget == "" {
		rawTarget = strings.TrimSpace(c.Query("email"))
	}
	targetEmail := ResolveEmail(rawTarget)
	if targetEmail == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	var user models.User
	if err := config.DB.Preload("Images").Where("email = ?", targetEmail).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "ไม่พบผู้ใช้นี้"})
	}

	prof := getProfileByEmail(user.Email)
	age := calculateAge(prof.BirthDate)

	var allImages []string
	sortedImages := make([]models.UserImage, len(user.Images))
	copy(sortedImages, user.Images)
	sort.Slice(sortedImages, func(i, j int) bool {
		return sortedImages[i].DisplayOrder < sortedImages[j].DisplayOrder
	})
	for _, img := range sortedImages {
		if img.ImageURL != "" {
			allImages = append(allImages, formatImageURL(img.ImageURL))
		}
	}
	if len(allImages) == 0 {
		firstImg := firstImageURL(user.Images)
		if firstImg != "" {
			allImages = append(allImages, firstImg)
		}
	}

	faculty := strings.TrimSpace(prof.Faculty)
	if faculty == "-" {
		faculty = ""
	}

	return c.JSON(fiber.Map{
		"profile": fiber.Map{
			"id":         HashEmail(user.Email),
			"hash":       HashEmail(user.Email),
			"email":      user.Email,
			"name":       user.Name,
			"age":        age,
			"gender":     prof.Gender,
			"preference": prof.Preference,
			"faculty":    faculty,
			"caption":    prof.Caption,
			"bio":        prof.Caption,
			"hobbies":    prof.Hobbies,
			"mbti":       prof.MBTI,
			"height":     prof.Height,
			"image":      firstImageURL(sortedImages),
			"images":     allImages,
		},
	})
}