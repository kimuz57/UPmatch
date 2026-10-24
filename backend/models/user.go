package models

import (
	"time"
	"gorm.io/gorm"
)

// ตาราง User (เก็บข้อมูลหลัก)
type User struct {
	Email     string         `gorm:"primaryKey;type:varchar(100)" json:"email"`
	Name      string         `gorm:"type:varchar(100);not null" json:"name"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at"` // Soft delete
	
	// Relations
	UserInfo  UserInfo       `gorm:"foreignKey:UserEmail;references:Email" json:"user_info"`
	Images    []UserImage    `gorm:"foreignKey:UserEmail;references:Email" json:"images"` // เพิ่มรูปภาพ (1 คนมีได้หลายรูป)
}

// ตารางรูปภาพผู้ใช้
type UserImage struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserEmail    string    `gorm:"type:varchar(100);index" json:"user_email"` // FK ชี้ไปที่ User
	ImageURL     string    `gorm:"type:text;not null" json:"image_url"` // ลิงก์รูปภาพ (หรือชื่อไฟล์)
	DisplayOrder int       `gorm:"default:0" json:"display_order"` // ลำดับรูป (0 = รูปโปรไฟล์หลักที่จะโชว์หน้าแรก)
	CreatedAt    time.Time `json:"created_at"`
}

// ตาราง UserInfo (ข้อมูลส่วนตัว ปล่อยว่างได้)
type UserInfo struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserEmail  string    `gorm:"type:varchar(100);uniqueIndex" json:"user_email"`
	Caption    string    `gorm:"type:text" json:"caption"` 
	Hobbies    string    `gorm:"type:text" json:"hobbies"` 
	MBTI       string    `gorm:"type:varchar(4)" json:"mbti"` 
	Height     int       `json:"height"` 
	BirthDate  time.Time `json:"birth_date"` 
	Gender     string    `gorm:"type:varchar(20)" json:"gender"` 
	Preference string    `gorm:"type:varchar(20)" json:"preference"` 
	Faculty    string    `json:"faculty"`
}

func (u *UserInfo) GetAge() int {
	if u.BirthDate.IsZero() {
		return 0
	}
	today := time.Now()
	age := today.Year() - u.BirthDate.Year()
	if today.YearDay() < u.BirthDate.YearDay() {
		age--
	}
	return age
}