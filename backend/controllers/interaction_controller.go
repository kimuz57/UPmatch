// backend/controllers/interaction_controller.go
package controllers

import (
	"strings"
	"upmatch-backend/config"
	"upmatch-backend/models"
	"github.com/gofiber/fiber/v2"
)

type SwipeRequest struct {
	MyEmail     string `json:"my_email"`
	TargetEmail string `json:"target_email"`
	Direction   string `json:"direction"` // "right" หรือ "left"
}

func HandleSwipe(c *fiber.Ctx) error {
	myEmail := GetCurrentUserEmail(c)

	var req SwipeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if myEmail == "" && req.MyEmail != "" {
		myEmail = strings.TrimSpace(req.MyEmail)
	}

	myEmail = strings.ToLower(strings.TrimSpace(myEmail))
	targetEmail := strings.ToLower(strings.TrimSpace(req.TargetEmail))

	if myEmail == "" || targetEmail == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized: ข้อมูลไม่ครบถ้วน"})
	}

	// ➡️ ถ้าปัดขวา (Like)
	if req.Direction == "right" {
		var existingLike models.Like
		err := config.DB.Where("LOWER(liker_id) = ? AND LOWER(liked_id) = ?", targetEmail, myEmail).First(&existingLike).Error

		if err == nil {
			// แมตช์!
			match := models.Match{User1ID: myEmail, User2ID: targetEmail}
			config.DB.Create(&match)
			config.DB.Delete(&existingLike)

			// 🚀 กระจายการแจ้งเตือน Match แบบ Realtime ไปยังทั้งสองฝ่ายทันที
			Hub.BroadcastMatch(match.ID, myEmail, targetEmail)

			var user models.User
			config.DB.Preload("Images").Where("LOWER(email) = ?", targetEmail).First(&user)
			
			prof := getProfileByEmail(targetEmail) 
			
			return c.JSON(fiber.Map{
				"match": true,
				"matched_profile": fiber.Map{
					"id":    user.Email,
					"name":  user.Name,
					"image": firstImageURL(user.Images),
					"bio":   prof.Caption,
				},
			})
		} else {
			// กด Like ฝ่ายเดียว
			var checkLike models.Like
			if config.DB.Where("LOWER(liker_id) = ? AND LOWER(liked_id) = ?", myEmail, targetEmail).First(&checkLike).Error != nil {
				like := models.Like{LikerID: myEmail, LikedID: targetEmail}
				config.DB.Create(&like)
			}
			return c.JSON(fiber.Map{"match": false})
		}
	}

	// ⬅️ ถ้าปัดซ้าย (Pass)
	if req.Direction == "left" {
		var checkPass models.Pass
		// เช็กก่อนว่าเคยปัดซ้ายคนนี้ไปแล้วหรือยัง ป้องกันบันทึกซ้ำ
		if config.DB.Where("LOWER(passer_id) = ? AND LOWER(passed_id) = ?", myEmail, targetEmail).First(&checkPass).Error != nil {
			pass := models.Pass{PasserID: myEmail, PassedID: targetEmail}
			config.DB.Create(&pass)
		}
		return c.JSON(fiber.Map{"match": false})
	}

	return c.JSON(fiber.Map{"match": false})
}

// 2. ดึงรายชื่อคนที่มากด Like เรา (แต่ยังไม่ Match)
func GetWhoLikesMe(c *fiber.Ctx) error {
	myEmail := GetCurrentUserEmail(c)
	if myEmail == "" {
		return c.Status(401).JSON(fiber.Map{
			"error":         "Unauthorized: กรุณาเข้าสู่ระบบ",
			"likers":        []fiber.Map{},
			"is_pro":        false,
			"account_type":  "standard",
			"referral_code": "",
		})
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(myEmail))

	var me models.User
	if err := config.DB.Where("LOWER(email) = ?", cleanEmail).First(&me).Error; err == nil {
		if me.ReferralCode == "" {
			me.ReferralCode = generateReferralCode(cleanEmail)
			config.DB.Save(&me)
		}
	}

	var likes []models.Like
	config.DB.Where("LOWER(liked_id) = ?", cleanEmail).Find(&likes)

	likers := []fiber.Map{}
	for _, l := range likes {
		var user models.User
		if config.DB.Preload("Images").Where("LOWER(email) = ?", strings.ToLower(l.LikerID)).First(&user).Error == nil {
			imageURL := firstImageURL(user.Images)
			prof := getProfileByEmail(user.Email)
			age := calculateAge(prof.BirthDate)

			likers = append(likers, fiber.Map{
				"id":      user.Email,
				"name":    user.Name,
				"image":   imageURL,
				"faculty": prof.Faculty,
				"caption": prof.Caption,
				"age":     age,
			})
		}
	}

	return c.JSON(fiber.Map{
		"likers":        likers,
		"is_pro":        me.IsPro,
		"account_type":  me.AccountType,
		"referral_code": me.ReferralCode,
	})
}