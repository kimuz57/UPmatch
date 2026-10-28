// backend/utils/email.go
package utils

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"os"
	"sync"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

// สุ่มตัวเลข OTP 6 หลัก
func GenerateOTP() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	return fmt.Sprintf("%06d", r.Intn(1000000))
}

// โหลด Token เดิมที่บันทึกไว้ (ถ้ามี)
func TokenFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	tok := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(tok)
	return tok, err
}

// บันทึก Token ลงไฟล์
func SaveToken(path string, token *oauth2.Token) error {
	fmt.Printf("Saving credential file to: %s\n", path)
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return fmt.Errorf("unable to cache oauth token: %v", err)
	}
	defer f.Close()
	return json.NewEncoder(f).Encode(token)
}

// autoSaveTokenSource ห่อ oauth2.TokenSource เพื่อเซฟ Token ใหม่ลงไฟล์อัตโนมัติเมื่อมีการ Refresh
type autoSaveTokenSource struct {
	mu        sync.Mutex
	filePath  string
	source    oauth2.TokenSource
	lastToken *oauth2.Token
}

func (s *autoSaveTokenSource) Token() (*oauth2.Token, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	tok, err := s.source.Token()
	if err != nil {
		return nil, err
	}

	// ถ้า Access Token มีการเปลี่ยนแปลง (เกิดจากการ Auto-refresh) ให้บันทึกลงไฟล์
	if s.lastToken == nil || tok.AccessToken != s.lastToken.AccessToken {
		log.Println("🔄 OAuth Token ได้รับการ Refresh สำเร็จ บันทึก token.json ใหม่อัตโนมัติ")
		s.lastToken = tok
		if err := SaveToken(s.filePath, tok); err != nil {
			log.Printf("⚠️ ไม่สามารถบันทึก Token ใหม่ลงไฟล์ได้: %v\n", err)
		}
	}
	return tok, nil
}

// ดึง Token ผ่าน Browser (ทำงานกรณีไม่มี token.json)
func getTokenFromWeb(config *oauth2.Config) (*oauth2.Token, error) {
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	fmt.Printf("\n>> กดเข้าลิงก์นี้ในเบราว์เซอร์ของคุณเพื่ออนุญาตการส่งอีเมล: \n%v\n\n", authURL)
	fmt.Print(">> นำ Authorization Code หรือ URL ที่ได้มาวางที่นี่: ")

	var authCode string
	if _, err := fmt.Scan(&authCode); err != nil {
		return nil, fmt.Errorf("unable to read authorization code: %v", err)
	}

	tok, err := config.Exchange(context.TODO(), authCode)
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve token from web: %v", err)
	}
	return tok, nil
}

var (
	gmailService   *gmail.Service
	gmailServiceMu sync.Mutex
)

func getCredentialsFilePath() string {
	if path := os.Getenv("GMAIL_CREDENTIALS_FILE"); path != "" {
		return path
	}
	return "credentials.json"
}

func getTokenFilePath() string {
	if path := os.Getenv("GMAIL_TOKEN_FILE"); path != "" {
		return path
	}
	return "token.json"
}

// GetGmailConfig คืนค่า oauth2.Config จาก credentials.json
func GetGmailConfig() (*oauth2.Config, error) {
	credFile := getCredentialsFilePath()
	b, err := os.ReadFile(credFile)
	if err != nil {
		return nil, fmt.Errorf("unable to read client secret file (%s): %v", credFile, err)
	}

	config, err := google.ConfigFromJSON(b, gmail.GmailSendScope)
	if err != nil {
		return nil, fmt.Errorf("unable to parse client secret file to config: %v", err)
	}
	return config, nil
}

// คืนค่า Client ของ Gmail API
func getGmailClient() (*gmail.Service, error) {
	gmailServiceMu.Lock()
	defer gmailServiceMu.Unlock()

	if gmailService != nil {
		return gmailService, nil
	}

	ctx := context.Background()
	config, err := GetGmailConfig()
	if err != nil {
		return nil, err
	}

	tokFile := getTokenFilePath()
	tok, err := TokenFromFile(tokFile)
	if err != nil {
		// ถ้าไม่มี Token จะให้ล็อกอินผ่านเบราว์เซอร์
		tok, err = getTokenFromWeb(config)
		if err != nil {
			return nil, err
		}
		if err := SaveToken(tokFile, tok); err != nil {
			return nil, err
		}
	}

	// ใช้ autoSaveTokenSource เพื่อเซฟ Token ใหม่ลงไฟล์เมื่อมีการ Auto-refresh
	savingSource := &autoSaveTokenSource{
		filePath:  tokFile,
		source:    config.TokenSource(ctx, tok),
		lastToken: tok,
	}

	srv, err := gmail.NewService(ctx, option.WithTokenSource(savingSource))
	if err != nil {
		return nil, err
	}

	gmailService = srv
	return gmailService, nil
}

// ฟังก์ชันส่งอีเมลจริงด้วย Gmail API
func SendEmailOTPWithGmailAPI(toEmail string, otp string) error {
	srv, err := getGmailClient()
	if err != nil {
		return err
	}

	// เพิ่ม base64 encoding ให้หัวข้ออีเมล
	encodedSubject := "=?utf-8?B?" + base64.StdEncoding.EncodeToString([]byte("รหัสยืนยันตัวตน UPyes ของคุณ")) + "?="
	body := fmt.Sprintf("รหัส OTP สำหรับเข้าสู่ระบบ UPyes คือ: <b>%s</b><br>รหัสนี้มีอายุการใช้งาน 5 นาที<br><br><i>โปรดอย่าให้รหัสนี้แก่ผู้อื่น</i>", otp)
	msgStr := fmt.Sprintf("To: %s\r\nSubject: %s\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s", toEmail, encodedSubject, body)

	msg := []byte(msgStr)
	message := &gmail.Message{
		Raw: base64.URLEncoding.EncodeToString(msg),
	}

	_, err = srv.Users.Messages.Send("me", message).Do()
	if err != nil {
		// หากส่งล้มเหลว ล้าง instance เผื่อกรณี Token ถูก Revoke จะได้ขอ Client ใหม่ได้
		gmailServiceMu.Lock()
		gmailService = nil
		gmailServiceMu.Unlock()
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}