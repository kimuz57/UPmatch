package utils

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"upmatch-backend/config"
	"upmatch-backend/models"

	"github.com/SherClockHolmes/webpush-go"
)

type PushPayload struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	Icon  string `json:"icon"`
	URL   string `json:"url"`
}

// SendWebPushToUser ส่ง Push Notification ไปยังทุกอุปกรณ์ (มือถือ/ไอแพด/คอม) ของผู้ใช้
func SendWebPushToUser(targetEmail string, payload PushPayload) {
	cleanEmail := strings.ToLower(strings.TrimSpace(targetEmail))
	if cleanEmail == "" {
		return
	}

	vapidPublic := os.Getenv("VAPID_PUBLIC_KEY")
	vapidPrivate := os.Getenv("VAPID_PRIVATE_KEY")
	vapidSubject := os.Getenv("VAPID_SUBJECT")
	if vapidSubject == "" {
		vapidSubject = "mailto:admin@upmatch.app"
	}

	if vapidPublic == "" || vapidPrivate == "" {
		return
	}

	var subs []models.PushSubscription
	if err := config.DB.Where("LOWER(email) = ?", cleanEmail).Find(&subs).Error; err != nil || len(subs) == 0 {
		return
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return
	}

	go func(subscriptions []models.PushSubscription, payloadBytes []byte) {
		for _, sub := range subscriptions {
			s := &webpush.Subscription{
				Endpoint: sub.Endpoint,
				Keys: webpush.Keys{
					P256dh: sub.P256dh,
					Auth:   sub.Auth,
				},
			}

			resp, err := webpush.SendNotification(payloadBytes, s, &webpush.Options{
				Subscriber:      vapidSubject,
				VAPIDPublicKey:  vapidPublic,
				VAPIDPrivateKey: vapidPrivate,
				TTL:             86400, // 24 ชั่วโมง
				Urgency:         webpush.UrgencyHigh,
			})

			if err != nil {
				log.Printf("⚠️ WebPush error for %s: %v\n", cleanEmail, err)
			} else if resp != nil {
				defer resp.Body.Close()
				// ถ้า subscription ถูกยกเลิกหรือหมดอายุ (404 Not Found หรือ 410 Gone) ให้ลบออกจากระบบ
				if resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusGone {
					config.DB.Delete(&sub)
				}
			}
		}
	}(subs, jsonBytes)
}
