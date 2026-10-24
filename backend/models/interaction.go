package models

import "time"

// ตาราง Like (ใครไลก์ใคร)
type Like struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	LikerID   string    `gorm:"type:varchar(100);index" json:"liker_id"` // คนที่ปัดขวา (อีเมล)
	LikedID   string    `gorm:"type:varchar(100);index" json:"liked_id"` // คนที่ถูกปัดขวา (อีเมล)
	CreatedAt time.Time `json:"created_at"`
}

type Pass struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	PasserID  string    `gorm:"type:varchar(100);index" json:"passer_id"`
	PassedID  string    `gorm:"type:varchar(100);index" json:"passed_id"`
	CreatedAt time.Time `json:"created_at"`
}

// ตาราง Match (เมื่อใจตรงกัน)
type Match struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	User1ID   string    `gorm:"type:varchar(100);index" json:"user1_id"` // อีเมลคนที่ 1
	User2ID   string    `gorm:"type:varchar(100);index" json:"user2_id"` // อีเมลคนที่ 2
	CreatedAt time.Time `json:"created_at"`
}

// ตาราง Report (รายงานผู้ใช้)
type Report struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ReporterID string    `gorm:"type:varchar(100);index" json:"reporter_id"` // อีเมลคนรายงาน
	ReportedID string    `gorm:"type:varchar(100);index" json:"reported_id"` // อีเมลคนถูกรายงาน
	Reason     string    `gorm:"type:varchar(200);not null" json:"reason"`   // หัวข้อเหตุผล
	Details    string    `gorm:"type:text" json:"details"`                   // รายละเอียดเพิ่มเติม
	CreatedAt  time.Time `json:"created_at"`
}