package models

import "time"

// ตารางเก็บข้อมูล Push Subscription สำหรับ Web Push Notification บนมือถือ/ไอแพด
type PushSubscription struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"type:varchar(100);index;not null" json:"email"`
	Endpoint  string    `gorm:"type:text;not null;uniqueIndex" json:"endpoint"`
	P256dh    string    `gorm:"type:text;not null" json:"p256dh"`
	Auth      string    `gorm:"type:text;not null" json:"auth"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
