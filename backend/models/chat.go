package models

import "time"

// ตาราง Message (เก็บข้อความแชท)
type Message struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	MatchID   uint      `gorm:"index;not null" json:"match_id"` // อ้างอิงจากตาราง Match
	SenderID  string    `gorm:"type:varchar(100);not null" json:"sender_id"` // อีเมลคนส่ง
	Content   string    `gorm:"type:text;not null" json:"content"` // ข้อความ
	IsRead    bool      `gorm:"default:false" json:"is_read"` // สถานะการอ่าน
	CreatedAt time.Time `json:"created_at"`
}