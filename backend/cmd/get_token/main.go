package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/gmail/v1"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("🔑 เครื่องมือรับ Google OAuth Token สำหรับ UPyes")
	fmt.Println("==================================================")

	credFile := "credentials.json"
	b, err := os.ReadFile(credFile)
	if err != nil {
		log.Fatalf("❌ ไม่พบไฟล์ %s: %v\n(โปรดตรวจสอบว่ารันคำสั่งจากโฟลเดอร์ backend)", credFile, err)
	}

	config, err := google.ConfigFromJSON(b, gmail.GmailSendScope)
	if err != nil {
		log.Fatalf("❌ ไม่สามารถแปลง %s เป็น OAuth Config: %v", credFile, err)
	}

	// ใช้ทั้ง AccessTypeOffline และ ApprovalForce เพื่อบังคับให้ออก Refresh Token เสมอ
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.ApprovalForce)

	fmt.Println("\n👉 ขั้นตอนที่ 1: เปิดลิงก์ด้านล่างนี้ในเว็บเบราว์เซอร์:")
	fmt.Println("--------------------------------------------------")
	fmt.Println(authURL)
	fmt.Println("--------------------------------------------------")
	fmt.Println("\n👉 ขั้นตอนที่ 2:")
	fmt.Println("1. ล็อกอินด้วยบัญชี Google ที่คุณต้องการใช้ส่งอีเมล")
	fmt.Println("2. กดยืนยันอนุญาตสิทธิ์การส่งอีเมล")
	fmt.Println("3. เบราว์เซอร์จะเปิดหน้าเว็บที่มีข้อความว่า 'This site can’t be reached' (ไม่ต้องตกใจ เป็นเรื่องปกติ)")
	fmt.Println("4. ให้คัดลอก URL ในช่อง Address Bar ทั้งหมด (หรือก๊อปปี้เฉพาะค่า code=...) มาวางที่นี่")
	fmt.Print("\n>> วาง Code หรือ URL ที่ได้ที่นี่: ")

	reader := bufio.NewReader(os.Stdin)
	input, err := reader.ReadString('\n')
	if err != nil {
		log.Fatalf("❌ ไม่สามารถอ่านค่าที่กรอกได้: %v", err)
	}

	authCode := strings.TrimSpace(input)
	if authCode == "" {
		log.Fatalf("❌ ค่าที่กรอกว่างเปล่า")
	}

	// ถ้าผู้ใช้วาง URL มาทั้งเส้น ให้ดึงเฉพาะ query parameter "code" ออกมา
	if strings.Contains(authCode, "code=") {
		parsedURL, err := url.Parse(authCode)
		if err == nil {
			if codeParam := parsedURL.Query().Get("code"); codeParam != "" {
				authCode = codeParam
			}
		}
	}

	tok, err := config.Exchange(context.Background(), authCode)
	if err != nil {
		log.Fatalf("❌ แลกเปลี่ยน Token ล้มเหลว: %v\n(กรุณาลองรันคำสั่งใหม่อีกครั้ง)", err)
	}

	tokenPath := "token.json"
	f, err := os.OpenFile(tokenPath, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		log.Fatalf("❌ ไม่สามารถเปิด/สร้างไฟล์ %s: %v", tokenPath, err)
	}
	defer f.Close()

	if err := json.NewEncoder(f).Encode(tok); err != nil {
		log.Fatalf("❌ ไม่สามารถบันทึก Token: %v", err)
	}

	fmt.Println("\n✅ สำเร็จ! บันทึกไฟล์ token.json เรียบร้อยแล้ว")
	if tok.RefreshToken != "" {
		fmt.Println("✅ ได้รับ Refresh Token ถาวรเรียบร้อย (ระบบจะ Auto-refresh เองตลอดไป)")
	} else {
		fmt.Println("⚠️ ข้อควรระวัง: ไม่พบ Refresh Token ในการตอบกลับจาก Google")
	}
	fmt.Println("🎉 ตอนนี้ระบบ Backend สามารถส่งอีเมล OTP ได้แล้วครับ!")
}
