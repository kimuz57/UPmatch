package controllers

import (
	"bufio"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
	"upmatch-backend/config"
	"upmatch-backend/models"
	"upmatch-backend/utils"
)

// --- ระบบ Realtime Event Hub สำหรับ SSE (Server-Sent Events) ---
type SSEPayload struct {
	Event string    `json:"event"`
	Data  fiber.Map `json:"data"`
}

type sseClient struct {
	email       string
	targetEmail string
	matchID     uint
	eventChan   chan SSEPayload
}

type chatHub struct {
	mu      sync.RWMutex
	clients map[*sseClient]bool
}

var Hub = &chatHub{
	clients: make(map[*sseClient]bool),
}

func (h *chatHub) Register(c *sseClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c] = true
}

func (h *chatHub) Unregister(c *sseClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, c)
}

func (h *chatHub) BroadcastMessage(msg models.Message, matchID uint, senderEmail, receiverEmail string) {
	senderClean := strings.ToLower(strings.TrimSpace(senderEmail))
	receiverClean := strings.ToLower(strings.TrimSpace(receiverEmail))

	var sender models.User
	config.DB.Preload("Images").Where("LOWER(email) = ?", senderClean).First(&sender)
	senderImg := firstImageURL(sender.Images)
	senderName := sender.Name
	if senderName == "" {
		senderName = senderClean
	}
	senderHash := HashEmail(senderClean)

	eventForReceiver := SSEPayload{
		Event: "message",
		Data: fiber.Map{
			"id":           msg.ID,
			"match_id":     matchID,
			"sender_id":    senderClean,
			"sender_hash":  senderHash,
			"sender_name":  senderName,
			"sender_image": senderImg,
			"is_me":        false,
			"content":      msg.Content,
			"created_at":   msg.CreatedAt.Format("15:04"),
			"timestamp":    msg.CreatedAt.Unix(),
			"is_read":      msg.IsRead,
		},
	}

	eventForSender := SSEPayload{
		Event: "message",
		Data: fiber.Map{
			"id":           msg.ID,
			"match_id":     matchID,
			"sender_id":    senderClean,
			"sender_hash":  senderHash,
			"sender_name":  senderName,
			"sender_image": senderImg,
			"is_me":        true,
			"content":      msg.Content,
			"created_at":   msg.CreatedAt.Format("15:04"),
			"timestamp":    msg.CreatedAt.Unix(),
			"is_read":      msg.IsRead,
		},
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		cEmail := strings.ToLower(strings.TrimSpace(client.email))
		cTarget := strings.ToLower(strings.TrimSpace(client.targetEmail))

		// ผู้รับ (Receiver)
		if cEmail == receiverClean {
			matchesRoom := client.matchID > 0 && client.matchID == matchID
			matchesPair := cTarget == senderClean
			matchesGlobal := cTarget == ""

			if matchesRoom || matchesPair || matchesGlobal {
				select {
				case client.eventChan <- eventForReceiver:
				default:
				}
			}
		}

		// ผู้ส่ง (Sender)
		if cEmail == senderClean {
			matchesRoom := client.matchID > 0 && client.matchID == matchID
			matchesPair := cTarget == receiverClean
			matchesGlobal := cTarget == ""

			if matchesRoom || matchesPair || matchesGlobal {
				select {
				case client.eventChan <- eventForSender:
				default:
				}
			}
		}
	}
}

// BroadcastMatch ส่งแจ้งเตือน Realtime เมื่อเกิด Match ระหว่างผู้ใช้ 2 คน
func (h *chatHub) BroadcastMatch(matchID uint, userAEmail, userBEmail string) {
	emailA := strings.ToLower(strings.TrimSpace(userAEmail))
	emailB := strings.ToLower(strings.TrimSpace(userBEmail))

	var userA models.User
	config.DB.Preload("Images").Where("LOWER(email) = ?", emailA).First(&userA)
	profA := getProfileByEmail(emailA)

	var userB models.User
	config.DB.Preload("Images").Where("LOWER(email) = ?", emailB).First(&userB)
	profB := getProfileByEmail(emailB)

	nameA := userA.Name
	if nameA == "" {
		nameA = emailA
	}
	nameB := userB.Name
	if nameB == "" {
		nameB = emailB
	}

	eventForB := SSEPayload{
		Event: "match",
		Data: fiber.Map{
			"match_id": matchID,
			"matched_user": fiber.Map{
				"id":      userA.Email,
				"hash":    HashEmail(userA.Email),
				"name":    nameA,
				"image":   firstImageURL(userA.Images),
				"caption": profA.Caption,
				"faculty": profA.Faculty,
			},
			"title":   "คุณมี Match ใหม่! 🎉",
			"message": fmt.Sprintf("คุณกับ %s ใจตรงกันแล้ว เริ่มแชทได้เลย!", nameA),
			"time":    time.Now().Format("15:04"),
		},
	}

	eventForA := SSEPayload{
		Event: "match",
		Data: fiber.Map{
			"match_id": matchID,
			"matched_user": fiber.Map{
				"id":      userB.Email,
				"hash":    HashEmail(userB.Email),
				"name":    nameB,
				"image":   firstImageURL(userB.Images),
				"caption": profB.Caption,
				"faculty": profB.Faculty,
			},
			"title":   "คุณมี Match ใหม่! 🎉",
			"message": fmt.Sprintf("คุณกับ %s ใจตรงกันแล้ว เริ่มแชทได้เลย!", nameB),
			"time":    time.Now().Format("15:04"),
		},
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		cEmail := strings.ToLower(strings.TrimSpace(client.email))
		if cEmail == emailB {
			select {
			case client.eventChan <- eventForB:
			default:
			}
		} else if cEmail == emailA {
			select {
			case client.eventChan <- eventForA:
			default:
			}
		}
	}

	// 📲 ส่ง Web Push Notification ไปยังมือถือ/ไอแพด (เด้งบนหน้าจอแม้พับจออยู่)
	utils.SendWebPushToUser(emailB, utils.PushPayload{
		Title: "ใจตรงกันแล้ว! 🎉",
		Body:  fmt.Sprintf("คุณกับ %s ใจตรงกันแล้ว เริ่มแชทได้เลย!", nameA),
		Icon:  firstImageURL(userA.Images),
		URL:   "/chat/" + HashEmail(emailA),
	})
	utils.SendWebPushToUser(emailA, utils.PushPayload{
		Title: "ใจตรงกันแล้ว! 🎉",
		Body:  fmt.Sprintf("คุณกับ %s ใจตรงกันแล้ว เริ่มแชทได้เลย!", nameB),
		Icon:  firstImageURL(userB.Images),
		URL:   "/chat/" + HashEmail(emailB),
	})
}

// 🚀 กระจายการแจ้งเตือน Realtime เมื่อผู้ใช้ได้รับการอัปเกรดเป็น PRO สำเร็จ
func (h *chatHub) BroadcastProUpgrade(userEmail string) {
	cleanEmail := strings.ToLower(strings.TrimSpace(userEmail))
	payload := SSEPayload{
		Event: "pro_upgrade",
		Data: fiber.Map{
			"type":       "pro_upgrade",
			"user_email": cleanEmail,
			"is_pro":     true,
			"title":      "อัปเกรดเป็น PRO สำเร็จ! ⭐",
			"message":    "เพื่อนของคุณสมัครสำเร็จแล้ว! ปลดล็อกฟีเจอร์ดูคนแอบชอบและแมตช์ได้ทันที",
			"time":       time.Now().Format("15:04"),
		},
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if strings.ToLower(strings.TrimSpace(client.email)) == cleanEmail {
			select {
			case client.eventChan <- payload:
			default:
			}
		}
	}

	// ส่ง Web Push Notification ไปยังมือถือ/เบราว์เซอร์ด้วย
	utils.SendWebPushToUser(cleanEmail, utils.PushPayload{
		Title: "อัปเกรดเป็น PRO สำเร็จ! ⭐",
		Body:  "เพื่อนของคุณสมัครสำเร็จแล้ว! ปลดล็อกฟีเจอร์ดูคนแอบชอบและแมตช์ได้ทันที",
		Icon:  "/logo.png",
		URL:   "/likes",
	})
}

// HashEmail แปลง Email เป็น Hash (MD5 32 hex) เพื่อซ่อน Email ใน URL เพื่อความเป็นส่วนตัว
func HashEmail(email string) string {
	clean := strings.ToLower(strings.TrimSpace(email))
	if clean == "" {
		return ""
	}
	return fmt.Sprintf("%x", md5.Sum([]byte(clean)))
}

// ResolveEmail แปลง Hash หรือ Identifier กลับมาเป็น Email ผู้ใช้จริงในระบบ
func ResolveEmail(identifier string) string {
	clean := strings.TrimSpace(identifier)
	if clean == "" {
		return ""
	}
	if unescaped, err := url.QueryUnescape(clean); err == nil && unescaped != "" {
		clean = strings.TrimSpace(unescaped)
	}

	// 1. ถ้าส่งมาเป็น Email ตรงๆ อยู่แล้ว
	if strings.Contains(clean, "@") {
		return clean
	}

	// 2. ถ้าส่งมาเป็น 32-character Hex Hash
	if len(clean) == 32 {
		var user models.User
		if err := config.DB.Where("md5(lower(email)) = ? OR md5(email) = ?", strings.ToLower(clean), clean).First(&user).Error; err == nil && user.Email != "" {
			return user.Email
		}

		// Fallback scan เผื่อ SQL function มีความแตกต่างในสภาพแวดล้อม
		var allUsers []models.User
		config.DB.Select("email").Find(&allUsers)
		for _, u := range allUsers {
			if HashEmail(u.Email) == strings.ToLower(clean) {
				return u.Email
			}
		}
	}

	// 3. Fallback ค้นหาจาก email ตรงๆ
	var directUser models.User
	if err := config.DB.Where("email = ?", clean).First(&directUser).Error; err == nil && directUser.Email != "" {
		return directUser.Email
	}

	return clean
}

func isMediaURL(text string) bool {
	lower := strings.ToLower(strings.TrimSpace(text))
	if !strings.HasPrefix(lower, "http://") && !strings.HasPrefix(lower, "https://") {
		return false
	}
	return strings.Contains(lower, "giphy.com") ||
		strings.Contains(lower, "tenor.com") ||
		strings.Contains(lower, ".gif") ||
		strings.Contains(lower, ".webp") ||
		strings.Contains(lower, ".png") ||
		strings.Contains(lower, ".jpg") ||
		strings.Contains(lower, ".jpeg")
}

// 1. ดึงรายการแชททั้งหมด (Inbox List)
func GetChats(c *fiber.Ctx) error {
	myEmail := GetCurrentUserEmail(c)
	if myEmail == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized", "chats": []fiber.Map{}})
	}

	var matches []models.Match
	config.DB.Where("user1_id = ? OR user2_id = ?", myEmail, myEmail).Find(&matches)

	type chatItem struct {
		data         fiber.Map
		lastActivity time.Time
	}
	var chatItems []chatItem

	for _, m := range matches {
		targetEmail := m.User1ID
		if targetEmail == myEmail {
			targetEmail = m.User2ID
		}

		var user models.User
		if err := config.DB.Preload("Images").Where("email = ?", targetEmail).First(&user).Error; err != nil {
			continue
		}

		prof := getProfileByEmail(user.Email)

		// ดึงข้อความล่าสุด
		var lastMsg models.Message
		hasMsg := false
		if err := config.DB.Where("match_id = ?", m.ID).Order("created_at desc").First(&lastMsg).Error; err == nil {
			hasMsg = true
		}

		// นับข้อความที่ยังไม่ได้อ่าน
		var unreadCount int64
		config.DB.Model(&models.Message{}).Where("match_id = ? AND sender_id = ? AND is_read = false", m.ID, targetEmail).Count(&unreadCount)

		timeStr := ""
		lastText := "เริ่มบทสนทนากันเลย!"
		isLastFromMe := false
		lastActivity := m.CreatedAt

		if hasMsg {
			lastActivity = lastMsg.CreatedAt
			isLastFromMe = (lastMsg.SenderID == myEmail)
			content := strings.TrimSpace(lastMsg.Content)
			if isMediaURL(content) {
				lower := strings.ToLower(content)
				if strings.Contains(lower, "giphy.com") || strings.Contains(lower, "tenor.com") || strings.Contains(lower, ".gif") {
					lastText = "[ส่ง GIF] 🎬"
				} else {
					lastText = "[ส่งรูปภาพ] 📷"
				}
			} else {
				lastText = content
			}

			if isLastFromMe {
				lastText = "คุณ : " + lastText
			}

			timeStr = lastMsg.CreatedAt.Format("15:04")
		} else {
			timeStr = m.CreatedAt.Format("15:04")
		}

		chatHash := HashEmail(user.Email)
		chatMap := fiber.Map{
			"id":           chatHash,
			"hash":         chatHash,
			"name":         user.Name,
			"image":        firstImageURL(user.Images),
			"lastMessage":  lastText,
			"isLastFromMe": isLastFromMe,
			"time":         timeStr,
			"timestamp":    lastActivity.Unix(),
			"updatedAt":    lastActivity.Format(time.RFC3339),
			"unread":       unreadCount,
			"faculty":      prof.Faculty,
		}

		chatItems = append(chatItems, chatItem{
			data:         chatMap,
			lastActivity: lastActivity,
		})
	}

	// เรียงลำดับตามข้อความหรือกิจกรรมล่าสุด (ล่าสุดอยู่บนสุด - Descending)
	sort.Slice(chatItems, func(i, j int) bool {
		return chatItems[i].lastActivity.After(chatItems[j].lastActivity)
	})

	chats := make([]fiber.Map, 0, len(chatItems))
	for _, item := range chatItems {
		chats = append(chats, item.data)
	}

	return c.JSON(fiber.Map{"chats": chats})
}

// 2. ดึงข้อความในห้องแชทของคู่แมตช์
func GetChatMessages(c *fiber.Ctx) error {
	myEmail := ResolveEmail(GetCurrentUserEmail(c))
	rawTarget := strings.TrimSpace(c.Params("target_email"))
	if rawTarget == "" {
		rawTarget = strings.TrimSpace(c.Query("target_email"))
	}
	targetEmail := ResolveEmail(rawTarget)

	if myEmail == "" || targetEmail == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ข้อมูลไม่ครบถ้วน"})
	}

	// ข้อมูลคู่สนทนา
	var targetUser models.User
	if err := config.DB.Preload("Images").Where("email = ?", targetEmail).First(&targetUser).Error; err != nil {
		if unescaped, uerr := url.QueryUnescape(targetEmail); uerr == nil && unescaped != targetEmail {
			if err2 := config.DB.Preload("Images").Where("email = ?", unescaped).First(&targetUser).Error; err2 == nil {
				targetEmail = unescaped
			} else {
				return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "ไม่พบผู้ใช้นี้"})
			}
		} else {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "ไม่พบผู้ใช้นี้"})
		}
	}
	targetProf := getProfileByEmail(targetUser.Email)

	// ค้นหาห้อง Match: ทั้งสองคนต้องแมตช์กันจริงๆ เท่านั้น (ห้ามสร้างแมตช์อัตโนมัติเด็ดขาด)
	var match models.Match
	err := config.DB.Where(
		"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		myEmail, targetEmail, targetEmail, myEmail,
	).First(&match).Error

	if err != nil || match.ID == 0 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "คุณไม่มีสิทธิ์เข้าถึงห้องแชทนี้ เนื่องจากยังไม่ได้แมตช์กัน",
			"not_matched": true,
		})
	}

	// อัปเดตข้อความที่ส่งมาให้เราเป็น "อ่านแล้ว"
	config.DB.Model(&models.Message{}).
		Where("match_id = ? AND sender_id = ? AND is_read = false", match.ID, targetEmail).
		Update("is_read", true)

	// ดึงประวัติข้อความ
	var messages []models.Message
	config.DB.Where("match_id = ?", match.ID).Order("created_at asc").Find(&messages)

	msgList := []fiber.Map{}
	for _, msg := range messages {
		msgList = append(msgList, fiber.Map{
			"id":         msg.ID,
			"sender_id":  msg.SenderID,
			"is_me":      msg.SenderID == myEmail,
			"content":    msg.Content,
			"created_at": msg.CreatedAt.Format("15:04"),
			"is_read":    msg.IsRead,
		})
	}

	var info models.UserInfo
	age := 0
	if err := config.DB.Where("user_email = ?", targetUser.Email).First(&info).Error; err == nil {
		age = info.GetAge()
	}
	if age == 0 && !targetProf.BirthDate.IsZero() {
		today := time.Now()
		age = today.Year() - targetProf.BirthDate.Year()
		if today.YearDay() < targetProf.BirthDate.YearDay() {
			age--
		}
	}

	var allTargetImages []string
	sortedImages := make([]models.UserImage, len(targetUser.Images))
	copy(sortedImages, targetUser.Images)
	sort.Slice(sortedImages, func(i, j int) bool {
		return sortedImages[i].DisplayOrder < sortedImages[j].DisplayOrder
	})
	for _, img := range sortedImages {
		if img.ImageURL != "" {
			allTargetImages = append(allTargetImages, formatImageURL(img.ImageURL))
		}
	}
	if len(allTargetImages) == 0 {
		firstImg := firstImageURL(targetUser.Images)
		if firstImg != "" {
			allTargetImages = append(allTargetImages, firstImg)
		}
	}

	faculty := strings.TrimSpace(targetProf.Faculty)
	if faculty == "-" {
		faculty = ""
	}

	return c.JSON(fiber.Map{
		"target_user": fiber.Map{
			"id":         HashEmail(targetUser.Email),
			"hash":       HashEmail(targetUser.Email),
			"email":      targetUser.Email,
			"name":       targetUser.Name,
			"image":      firstImageURL(sortedImages),
			"images":     allTargetImages,
			"faculty":    faculty,
			"bio":        targetProf.Caption,
			"caption":    targetProf.Caption,
			"mbti":       targetProf.MBTI,
			"hobbies":    targetProf.Hobbies,
			"gender":     targetProf.Gender,
			"preference": targetProf.Preference,
			"age":        age,
			"birth_date": targetProf.BirthDate,
		},
		"messages": msgList,
	})
}

// 3. ส่งข้อความแชท
type SendMessageRequest struct {
	MyEmail     string `json:"my_email"`
	TargetEmail string `json:"target_email"`
	Content     string `json:"content"`
}

func SendMessage(c *fiber.Ctx) error {
	myEmail := ResolveEmail(GetCurrentUserEmail(c))

	var req SendMessageRequest
	if err := c.BodyParser(&req); err != nil {
		if jsonErr := json.Unmarshal(c.Body(), &req); jsonErr != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "รูปแบบข้อมูลไม่ถูกต้อง: " + err.Error()})
		}
	}

	if myEmail == "" && req.MyEmail != "" {
		myEmail = ResolveEmail(strings.TrimSpace(req.MyEmail))
	}
	targetEmail := ResolveEmail(strings.TrimSpace(req.TargetEmail))
	content := strings.TrimSpace(req.Content)

	if myEmail == "" || targetEmail == "" || content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "กรุณากรอกข้อความและผู้รับ"})
	}

	// ค้นหาห้อง Match: ต้องแมตช์กันจริงๆ เท่านั้น
	var match models.Match
	err := config.DB.Where(
		"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		myEmail, targetEmail, targetEmail, myEmail,
	).First(&match).Error

	if err != nil || match.ID == 0 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "ไม่สามารถส่งข้อความได้ เนื่องจากยังไม่ได้แมตช์กัน",
			"not_matched": true,
		})
	}

	// บันทึกข้อความลง Database
	newMsg := models.Message{
		MatchID:   match.ID,
		SenderID:  myEmail,
		Content:   content,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	if err := config.DB.Create(&newMsg).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "ส่งข้อความไม่สำเร็จ"})
	}

	// 🚀 กระจายข้อความแบบ Realtime ผ่าน SSE ไปยังคู่สนทนาและผู้ส่งทันที
	Hub.BroadcastMessage(newMsg, match.ID, myEmail, targetEmail)

	// 📲 ส่ง Web Push Notification ไปยังมือถือ/ไอแพดของผู้รับ (เด้งบนหน้าจอแม้พับจอ/ปิดบราวเซอร์)
	var sender models.User
	config.DB.Preload("Images").Where("LOWER(email) = ?", strings.ToLower(myEmail)).First(&sender)
	senderName := sender.Name
	if senderName == "" {
		senderName = "เพื่อนใน UP Match"
	}
	pushText := content
	if isMediaURL(content) {
		if strings.Contains(strings.ToLower(content), ".gif") || strings.Contains(strings.ToLower(content), "giphy") {
			pushText = "[ส่ง GIF] 🎬"
		} else {
			pushText = "[ส่งรูปภาพ] 📷"
		}
	}
	utils.SendWebPushToUser(targetEmail, utils.PushPayload{
		Title: senderName,
		Body:  pushText,
		Icon:  firstImageURL(sender.Images),
		URL:   "/chat/" + HashEmail(myEmail),
	})

	return c.JSON(fiber.Map{
		"success": true,
		"message": fiber.Map{
			"id":         newMsg.ID,
			"sender_id":  newMsg.SenderID,
			"is_me":      true,
			"content":    newMsg.Content,
			"created_at": newMsg.CreatedAt.Format("15:04"),
			"is_read":    false,
		},
	})
}

// 4. SSE (Server-Sent Events) Endpoint สำหรับ Realtime Chat & Inbox
func ChatSSE(c *fiber.Ctx) error {
	requestedEmail := strings.TrimSpace(c.Query("email"))
	if requestedEmail == "" {
		requestedEmail = strings.TrimSpace(c.Query("my_email"))
	}
	if requestedEmail == "" {
		requestedEmail = GetCurrentUserEmail(c)
	}
	myEmail := strings.ToLower(strings.TrimSpace(ResolveEmail(requestedEmail)))
	if myEmail == "" {
		return c.Status(fiber.StatusUnauthorized).SendString("Unauthorized: กรุณาเข้าสู่ระบบ")
	}

	rawTarget := strings.TrimSpace(c.Query("target_email"))
	if rawTarget == "" {
		rawTarget = strings.TrimSpace(c.Params("target_email"))
	}
	targetEmail := ""
	var matchID uint = 0

	// ถ้าเป็นการเชื่อมต่อจากห้องแชทเฉพาะเจาะจง (มี target_email)
	if rawTarget != "" {
		targetEmail = ResolveEmail(rawTarget)
		if targetEmail != "" {
			var match models.Match
			err := config.DB.Where(
				"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
				myEmail, targetEmail, targetEmail, myEmail,
			).First(&match).Error
			if err != nil || match.ID == 0 {
				return c.Status(fiber.StatusForbidden).SendString("Forbidden: Not matched")
			}
			matchID = match.ID
		}
	}

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")

	origin := c.Get("Origin")
	if origin == "" {
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL != "" {
			parts := strings.Split(frontendURL, ",")
			origin = strings.TrimSpace(parts[0])
		} else {
			origin = "http://localhost:3003"
		}
	}
	c.Set("Access-Control-Allow-Origin", origin)
	c.Set("Access-Control-Allow-Credentials", "true")
	c.Set("Access-Control-Allow-Headers", "Cache-Control, Authorization, Content-Type, X-User-Email")

	client := &sseClient{
		email:       myEmail,
		targetEmail: targetEmail,
		matchID:     matchID,
		eventChan:   make(chan SSEPayload, 50),
	}
	Hub.Register(client)

	c.Context().SetBodyStreamWriter(fasthttp.StreamWriter(func(w *bufio.Writer) {
		defer Hub.Unregister(client)

		// แจ้งเตือนเมื่อต่อสำเร็จ
		if matchID > 0 {
			fmt.Fprintf(w, "event: connected\ndata: {\"status\":\"connected\",\"match_id\":%d}\n\n", matchID)
		} else {
			fmt.Fprintf(w, "event: connected\ndata: {\"status\":\"connected\",\"type\":\"global_notifications\"}\n\n")
		}
		if err := w.Flush(); err != nil {
			return
		}

		ticker := time.NewTicker(20 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case evt, ok := <-client.eventChan:
				if !ok {
					return
				}
				data, err := json.Marshal(evt.Data)
				if err == nil {
					fmt.Fprintf(w, "event: %s\ndata: %s\n\n", evt.Event, string(data))
					if err := w.Flush(); err != nil {
						return
					}
				}
			case <-ticker.C:
				// ส่ง Heartbeat Ping ป้องกัน Timeout
				fmt.Fprintf(w, ": ping\n\n")
				if err := w.Flush(); err != nil {
					return
				}
			}
		}
	}))

	return nil
}

// 5. ยกเลิกการแมตช์ (Unmatch)
type UnmatchRequest struct {
	MyEmail     string `json:"my_email"`
	TargetEmail string `json:"target_email"`
}

func Unmatch(c *fiber.Ctx) error {
	myEmail := ResolveEmail(GetCurrentUserEmail(c))
	var req UnmatchRequest
	_ = c.BodyParser(&req)
	if myEmail == "" && req.MyEmail != "" {
		myEmail = ResolveEmail(req.MyEmail)
	}
	targetEmail := ResolveEmail(req.TargetEmail)

	if myEmail == "" || targetEmail == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ข้อมูลไม่ครบถ้วน"})
	}

	// 1. ค้นหาห้อง Match และลบข้อความในห้อง
	var match models.Match
	if err := config.DB.Where(
		"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
		myEmail, targetEmail, targetEmail, myEmail,
	).First(&match).Error; err == nil && match.ID > 0 {
		config.DB.Where("match_id = ?", match.ID).Delete(&models.Message{})
		config.DB.Delete(&match)
	}

	// 2. ลบ Like ของทั้งสองฝ่าย
	config.DB.Where(
		"(liker_id = ? AND liked_id = ?) OR (liker_id = ? AND liked_id = ?)",
		myEmail, targetEmail, targetEmail, myEmail,
	).Delete(&models.Like{})

	// 3. เพิ่มลงตาราง Pass เพื่อไม่ให้ปัดมาเจอกันอีก
	config.DB.Create(&models.Pass{
		PasserID:  myEmail,
		PassedID:  targetEmail,
		CreatedAt: time.Now(),
	})

	// 🚀 แจ้งเตือนผ่าน SSE ให้ทั้งสองฝ่ายอัปเดต Inbox ทันที
	dummyMsg := models.Message{
		MatchID:   match.ID,
		SenderID:  myEmail,
		Content:   "[UNMATCH]",
		CreatedAt: time.Now(),
	}
	Hub.BroadcastMessage(dummyMsg, match.ID, myEmail, targetEmail)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "ยกเลิกการแมตช์สำเร็จ",
	})
}

// 6. รายงานผู้ใช้ (Report)
type ReportRequest struct {
	MyEmail     string `json:"my_email"`
	TargetEmail string `json:"target_email"`
	Reason      string `json:"reason"`
	Details     string `json:"details"`
	AlsoUnmatch bool   `json:"also_unmatch"`
}

func ReportUser(c *fiber.Ctx) error {
	myEmail := ResolveEmail(GetCurrentUserEmail(c))
	var req ReportRequest
	_ = c.BodyParser(&req)
	if myEmail == "" && req.MyEmail != "" {
		myEmail = ResolveEmail(req.MyEmail)
	}
	targetEmail := ResolveEmail(req.TargetEmail)

	if myEmail == "" || targetEmail == "" || req.Reason == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "กรุณาระบุเหตุผลการรายงาน"})
	}

	report := models.Report{
		ReporterID: myEmail,
		ReportedID: targetEmail,
		Reason:     req.Reason,
		Details:    req.Details,
		CreatedAt:  time.Now(),
	}
	config.DB.Create(&report)

	if req.AlsoUnmatch {
		var match models.Match
		if err := config.DB.Where(
			"(user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
			myEmail, targetEmail, targetEmail, myEmail,
		).First(&match).Error; err == nil && match.ID > 0 {
			config.DB.Where("match_id = ?", match.ID).Delete(&models.Message{})
			config.DB.Delete(&match)
		}
		config.DB.Where(
			"(liker_id = ? AND liked_id = ?) OR (liker_id = ? AND liked_id = ?)",
			myEmail, targetEmail, targetEmail, myEmail,
		).Delete(&models.Like{})
		config.DB.Create(&models.Pass{
			PasserID:  myEmail,
			PassedID:  targetEmail,
			CreatedAt: time.Now(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "ส่งรายงานเรียบร้อยแล้ว ทีมงานจะตรวจสอบอย่างเร่งด่วน",
	})
}

// 7. ดึงจำนวนแจ้งเตือนที่ยังไม่ได้เปิดดู (Unread Messages & New Matches)
func GetUnreadCounts(c *fiber.Ctx) error {
	myEmail := ResolveEmail(GetCurrentUserEmail(c))
	if myEmail == "" {
		return c.JSON(fiber.Map{
			"unread_messages": 0,
			"unread_matches":  0,
		})
	}
	cleanEmail := strings.ToLower(strings.TrimSpace(myEmail))

	// 1. นับข้อความที่ยังไม่ได้อ่าน
	var unreadCount int64 = 0
	config.DB.Model(&models.Message{}).
		Joins("JOIN matches ON matches.id = messages.match_id").
		Where("(LOWER(matches.user1_id) = ? OR LOWER(matches.user2_id) = ?) AND LOWER(messages.sender_id) != ? AND messages.is_read = false", cleanEmail, cleanEmail, cleanEmail).
		Count(&unreadCount)

	// 2. ดึง Matches ที่ยังไม่มีข้อความส่งหากัน (ถือว่าเป็น Match ใหม่)
	var newMatchesCount int64 = 0
	config.DB.Raw(`
		SELECT COUNT(*) FROM matches m
		WHERE (LOWER(m.user1_id) = ? OR LOWER(m.user2_id) = ?)
		AND NOT EXISTS (SELECT 1 FROM messages msg WHERE msg.match_id = m.id)
	`, cleanEmail, cleanEmail).Scan(&newMatchesCount)

	return c.JSON(fiber.Map{
		"unread_messages": unreadCount,
		"unread_matches":  newMatchesCount,
	})
}
