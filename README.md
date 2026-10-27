# 💜 UP Match - เว็บแอปพลิเคชันหาเพื่อน & คนรู้ใจ นิสิตมหาวิทยาลัยพะเยา

<p align="center">
  <img src="frontend/public/logo.png" alt="UP Match Logo" width="140" style="border-radius: 24px; box-shadow: 0 10px 25px rgba(168, 85, 247, 0.25);" />
</p>

<p align="center">
  <b>"ค้นหาเพื่อนใหม่ คนรู้ใจ และคอมมูนิตี้เด็ก มพ. ในแบบที่คุณเป็น"</b><br/>
  แอปพลิเคชันจับคู่และสังคมออนไลน์ที่ออกแบบมาเพื่อนิสิตมหาวิทยาลัยพะเยาโดยเฉพาะ รวดเร็ว ปลอดภัย รองรับ PWA และใช้งานได้สมบูรณ์แบบบนทุกอุปกรณ์
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Go_(Golang)-00ADD8?style=for-the-badge&logo=go&logoColor=white" alt="Golang" />
  <img src="https://img.shields.io/badge/Fiber_v2-00ACD7?style=for-the-badge&logo=go&logoColor=white" alt="Fiber" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
</p>

---

## ✨ ฟีเจอร์เด่นและจุดเด่นของระบบ (Key Features)

### 1. 🎓 ระบบคัดกรองนิสิต มพ. แท้ 100% (UP Student Verification)
- เข้าสู่ระบบด้วยอีเมลสถาบันมหาวิทยาลัยพะเยา (`@up.ac.th`) เท่านั้น
- ส่งรหัส OTP ยืนยันตัวตนแบบใช้ครั้งเดียวผ่าน Gmail API / SMTP
- ตรวจจับคณะและชั้นปีอัตโนมัติจากรหัสนิสิต 8 หลัก
- **Dev/Test Sandbox:** รองรับบัญชีทดสอบสำหรับนักพัฒนา (ขึ้นต้นด้วยรหัสที่กำหนด เช่น `123...`) โดยไม่ต้องส่งอีเมลจริง

### 2. 🃏 ฟีดการ์ดปัดหาเพื่อนสุดลื่นไหล (Tinder-Style Swipe Deck)
- ปัดขวาเพื่อ **ถูกใจ (Like)**, ปัดซ้ายเพื่อ **ข้าม (Pass)**
- ระบบคัดกรองเพศที่ต้องการพบ (ชาย, หญิง หรือทุกคน) และคณะที่สนใจ
- ตรวจสอบประวัติการปัดแบบเรียลไทม์ ป้องกันการแสดงผลคนเดิมซ้ำ และไม่แสดงโปรไฟล์ของตนเอง

### 3. 🖼️ ระบบจัดการรูปภาพ 9 ช่องสไตล์ Tinder (9-Slot Photo Manager)
- อัปโหลดและจัดระเบียบรูปภาพโปรไฟล์ได้สูงสุด 9 รูป (กำหนดขั้นต่ำและสูงสุดผ่าน `.env`)
- **Drag & Drop Reorder:** กดค้างแล้วลากเพื่อสลับตำแหน่งรูปภาพได้อย่างอิสระ
- **One-Tap Replace:** แตะรูปเดิมเพื่อเลือกลบและแทนที่ด้วยรูปใหม่ได้ทันที
- **Responsive Aspect:** รองรับการแสดงผลอัตราส่วน 3:4 สวยงามบนมือถือและคอมพิวเตอร์

### 4. 💬 แชทเรียลไทม์ผ่าน SSE (Server-Sent Events)
- สตรีมข้อความสองฝั่งแบบ Real-time ทันทีที่เกิดการ Match กัน
- ค้นหาและส่งสติกเกอร์ GIF ดุ๊กดิ๊กผ่านคลัง **GIPHY API**
- แสดงสถานะข้อความอ่านแล้ว (Read Receipts)
- มีระบบรายงานผู้ใช้ (Report) และยกเลิกการจับคู่ (Unmatch) เพื่อความปลอดภัยของผู้ใช้งาน

### 5. 🎉 การเฉลิมฉลองเมื่อใจตรงกัน (Mutual Match Celebration)
- เมื่อกดไลก์ตรงกัน ระบบจะแสดงหน้าต่างเฉลิมฉลอง Match ทันทีทั้งสองฝั่งพร้อมกัน
- สร้างเสียงดนตรีสังเคราะห์ต้อนรับผ่าน **Web Audio API** (ไม่ต้องพึ่งพาไฟล์เสียงภายนอก)
- แสดงเอฟเฟกต์ละอองพลุหลากสีสัน (Confetti Particle Animation)

### 6. 📲 รองรับ PWA & Web Push Notification (แจ้งเตือนตอนพับหน้าจอ)
- ติดตั้งเป็นแอปบนหน้าจอมือถือได้ทันที (Add to Home Screen ทั้ง iOS และ Android)
- รองรับมาตรฐาน **VAPID Web Push Protocol (RFC 8292)** ทำงานคู่กับ Service Worker (`sw.js`)
- ได้รับการแจ้งเตือนข้อความใหม่และ Match ใหม่ แม้ในขณะพับหน้าจอหรือจอดับอยู่

### 7. 📱💻 ระบบแสดงผล Responsive อัจฉริยะ (Adaptive Device Mode)
- **Mobile Mode:** ปรับสเกลเต็มจอ ขอบโค้งมนกระชับมือ เหมาะสำหรับสมาร์ตโฟนและ iPad ในแนวตั้ง
- **Desktop Mode:** จัดวางหน้าจอแบ่งฝั่งซ้าย-ขวา พร้อม Sidebar และการ์ดควบคุมสำหรับหน้าจอ PC และแท็บเล็ตในแนวนอน
- **Automatic LAN Host Switching:** เมื่อทดสอบผ่านอุปกรณ์ในเครือข่าย Wi-Fi เดียวกัน (เช่น iPad `192.168.x.x`) ระบบจะแปลง Host ของ API และรูปภาพให้เชื่อมต่อกับคอมพิวเตอร์หลักให้อัตโนมัติ

### 8. 🛡️ สถาปัตยกรรมความปลอดภัยและ Environment Configuration
- จัดการค่าคอนฟิก พอร์ต คีย์ลับ และ URL ทั้งหมดผ่าน `.env` อย่างเป็นระเบียบ ทั้งฝั่ง Frontend (`.env.local`) และ Backend (`.env`)
- การป้องกันการสวมรอย Session ด้วย Cryptographic Signature บน URL ห้องแชท

---

## 🛠️ สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack)

```
UPER/
├── frontend/             # Next.js 16 (App Router) + React 19 + Tailwind v4 + Framer Motion
└── backend/              # Go (Golang) + Fiber v2 + GORM + PostgreSQL + Redis
```

### Frontend
- **Framework:** [Next.js 16.4](https://nextjs.org/) (Turbopack, App Router)
- **Core Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **PWA & Push:** Service Worker (`sw.js`), Web App Manifest, PushManager & Notification API
- **Audio & Visual:** Web Audio API (Synthesizer Chimes), Canvas Confetti

### Backend
- **Language:** [Go (Golang 1.22+)](https://golang.org/)
- **HTTP Engine:** [Fiber v2](https://gofiber.io/) (High-performance framework based on Fasthttp)
- **ORM:** [GORM](https://gorm.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Cache & Session:** [Redis](https://redis.io/)
- **Real-time Engine:** Server-Sent Events (SSE) Client Channel Pool Hub
- **Web Push:** [webpush-go](https://github.com/SherClockHolmes/webpush-go) (VAPID RFC 8292)
- **Mailer:** Gmail API Client (OAuth2) & Go SMTP Client

---

## 📂 โครงสร้างไดเรกทอรีของโปรเจกต์ (Project Structure)

```text
UPER/
├── backend/
│   ├── config/                      # การตั้งค่าฐานข้อมูล, Redis และ Storage
│   │   ├── database.go              # เชื่อมต่อ PostgreSQL และ Auto-Migrate
│   │   ├── redis.go                 # เชื่อมต่อ Redis Client
│   │   └── storage.go               # กำหนดพาธจัดเก็บรูปภาพอัปโหลด
│   ├── controllers/                 # Business Logic และ Handler ของ API
│   │   ├── auth_controller.go       # ส่ง/ยืนยัน OTP, จัดการ Session & Test Accounts
│   │   ├── chat_controller.go       # แชท, SSE Hub, ดึงประวัติ, Unmatch, Report
│   │   ├── feed_controller.go       # ดึงฟีดนิสิต, จัดการ URL รูปภาพ
│   │   ├── interaction_controller.go# ปัดขวา/ซ้าย (Like/Pass), Who Likes Me
│   │   ├── notification_controller.go# นับข้อความที่ยังไม่อ่าน, จัดการ Web Push
│   │   └── profile_controller.go    # ข้อมูลโปรไฟล์, ตรวจสอบรูปภาพ 9 ช่อง
│   ├── models/                      # GORM Data Schemas
│   │   ├── user.go                  # บัญชีนิสิต, ข้อมูลส่วนตัว, รูปภาพ
│   │   ├── interaction.go           # ประวัติการไลก์, ข้าม, และการแมตช์
│   │   ├── chat.go                  # ข้อความแชท
│   │   └── notification.go          # Push Subscription Token ของอุปกรณ์
│   ├── routes/
│   │   └── routes.go                # รวมเส้นทาง API Endpoints ทั้งหมด (/api/v1)
│   ├── utils/
│   │   ├── email.go                 # สุ่ม OTP และส่งอีเมลผ่าน Gmail API / SMTP
│   │   └── webpush.go               # ส่ง Push Notification ไปยังเบราว์เซอร์
│   ├── uploads/                     # โฟลเดอร์เก็บรูปภาพโปรไฟล์
│   ├── .env.example                 # ตัวอย่างการกำหนด Environment Variables ของ Backend
│   ├── go.mod                       # รายการ Go Modules & Dependencies
│   └── main.go                      # จุดเริ่มต้นของ Backend Server (Go Fiber)
│
├── frontend/
│   ├── app/                         # Next.js App Router (หน้าเว็บทั้งหมด)
│   │   ├── page.tsx                 # Landing Page & ตรวจสอบ Session อัตโนมัติ
│   │   ├── swipe/                   # หน้าการ์ดปัดหาเพื่อน
│   │   ├── chat/                    # หน้ารวมแชท และห้องแชท (/chat/[id])
│   │   ├── matches/                 # หน้าแสดงคนที่ใจตรงกัน (Mutual Matches)
│   │   ├── likes/                   # หน้าดูคนที่มากดถูกใจเรา (Who Likes Me)
│   │   ├── profile/                 # หน้าโปรไฟล์ส่วนตัว, ตั้งค่า, อัปโหลดรูป 9 ช่อง
│   │   ├── onboarding/              # หน้าตั้งค่าโปรไฟล์สำหรับผู้ใช้ใหม่
│   │   ├── layout.tsx               # Root Layout + พื้นหลัง Animated Hearts
│   │   └── globals.css              # Global CSS & Tailwind Setup
│   ├── components/                  # Reusable UI Components
│   │   ├── AuthPage.jsx             # หน้าต่างกรอกอีเมล @up.ac.th และรหัส OTP
│   │   ├── FloatingHeartsBackground.jsx # แอนิเมชันหัวใจลอยรอบเว็บ
│   │   ├── GlobalNotification.jsx   # ตัวจัดการเสียงเตือน, Toast & Push Subscription
│   │   ├── Navbar.jsx               # แถบนำทางพร้อมตัวเลขแจ้งเตือนแบบเรียลไทม์
│   │   └── ProfileDetailModal.jsx   # ป๊อปอัปดูโปรไฟล์และรูปภาพแบบเต็ม
│   ├── public/
│   │   ├── manifest.json            # PWA Web App Manifest
│   │   ├── sw.js                    # Service Worker สำหรับ Background Web Push
│   │   └── logo.png                 # โลโก้แอปพลิเคชัน UP Match
│   ├── utils/
│   │   ├── api.js                   # ดึง Base URL และจัดการพาธรูปภาพผ่าน .env
│   │   └── session.js               # สร้าง Cryptographic Signature ป้องกันลิงก์แชท
│   ├── middleware.ts                # Next.js Middleware ป้องกัน Route ที่ต้องล็อกอิน
│   ├── next.config.ts               # Next.js Config (Turbopack, Rewrites, Dev Origins)
│   ├── .env.example                 # ตัวอย่างการกำหนด Environment Variables ของ Frontend
│   └── package.json                 # Node.js Dependencies และ Scripts
│
├── test-user.json                   # ชุดข้อมูลจำลองนิสิต มพ. สำหรับทดสอบระบบ
├── .gitignore                       # ป้องกันการ Commit ไฟล์สำคัญและ Credentials
└── README.md                        # เอกสารแนะนำและคู่มือการใช้งานระบบ
```

---

## 🚀 คู่มือการติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. ความต้องการของระบบ (Prerequisites)
- [Node.js](https://nodejs.org/) (เวอร์ชัน 18.x หรือ 20.x ขึ้นไป)
- [Go (Golang)](https://go.dev/) (เวอร์ชัน 1.22 หรือใหม่กว่า)
- [PostgreSQL](https://www.postgresql.org/) (พอร์ต 5432 หรือ 5433)
- [Redis](https://redis.io/) (พอร์ต 6379)

---

### 2. การตั้งค่าฝั่ง Backend (Go Fiber)

1. เข้าไปยังไดเรกทอรี `backend`:
   ```bash
   cd backend
   ```

2. สร้างไฟล์ `.env` จาก `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. ปรับแต่งค่าใน `backend/.env`:
   ```env
   # พอร์ตเซิร์ฟเวอร์ Backend และ Origin ของ Frontend
   PORT=8081
   FRONTEND_URL=http://localhost:3003,http://127.0.0.1:3003

   # ข้อมูลการเชื่อมต่อฐานข้อมูล PostgreSQL
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=upmatch
   DB_PORT=5433

   # ข้อมูลการเชื่อมต่อ Redis Cache
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=1

   # VAPID Keys สำหรับ Web Push Notifications
   VAPID_PUBLIC_KEY=BKv9oOXXiRNmJEuoYDZ0GpduxCgAabgeoXxqEoZtwMX14odoTySGkchhwGitGTsC-0BZ_EmDn_6bC1foUSZiVr4
   VAPID_PRIVATE_KEY=X52gLYl8ASUA2mVjwynucWT-juTsB3qn6yowkpr47Gc
   VAPID_SUBJECT=mailto:your-email@gmail.com
   WEBPUSH_TTL=86400

   # ระบบบัญชีทดสอบสำหรับการพัฒนา
   ENABLE_TEST_ACCOUNTS=true
   TEST_ACCOUNT_PREFIX=123
   TEST_ACCOUNT_OTP=123456

   # ข้อกำหนดจำนวนรูปโปรไฟล์
   MIN_PROFILE_PHOTOS=2
   MAX_PROFILE_PHOTOS=9
   ```

4. ดาวน์โหลด Dependencies และเริ่มรันเซิร์ฟเวอร์:
   ```bash
   go mod download
   go run main.go
   # หรือใช้ air สำหรับโหมด Hot Reload ขณะพัฒนา
   air
   ```
   > เซิร์ฟเวอร์ Backend พร้อมทำงานที่: `http://localhost:8081`

---

### 3. การตั้งค่าฝั่ง Frontend (Next.js)

1. เข้าไปยังไดเรกทอรี `frontend`:
   ```bash
   cd frontend
   ```

2. สร้างไฟล์ `.env.local` จาก `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

3. ปรับแต่งค่าใน `frontend/.env.local`:
   ```env
   # URL ของ Backend API
   NEXT_PUBLIC_API_URL=http://localhost:8081

   # GIPHY API Key สำหรับส่ง GIF ในห้องแชท
   NEXT_PUBLIC_GIPHY_API_KEY=sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh

   # Secret Salt สำหรับสร้าง Session Signature
   NEXT_PUBLIC_SESSION_SECRET=upmatch_session_secret_salt_2026

   # อนุญาต Origin สำหรับทดสอบบน iPad / มือถือในเครือข่าย LAN
   ALLOWED_DEV_ORIGINS=192.168.1.109,192.168.1.109:3003
   ```

4. ติดตั้ง Node Dependencies:
   ```bash
   npm install
   ```

5. รันเซิร์ฟเวอร์ Next.js ในโหมดพัฒนา:
   ```bash
   npm run dev
   ```
   > เว็บแอปพลิเคชัน Frontend พร้อมใช้งานที่: `http://localhost:3003`

---

### 4. การทดสอบด้วยบัญชีจำลอง (Test Accounts)

เมื่อเปิดใช้งาน `ENABLE_TEST_ACCOUNTS=true` ใน `backend/.env`:
- ใช้อีเมลที่ขึ้นต้นด้วยรหัสที่กำหนด (เช่น `12368668@up.ac.th` หรืออีเมลใดๆ จาก [test-user.json](file:///d:/tcmg/UPER/test-user.json))
- ระบบจะข้ามการส่งอีเมลจริง และใช้รหัสยืนยัน OTP: **`123456`** เสมอ ทำให้สามารถทดสอบฟังก์ชันต่างๆ ได้ทันทีโดยไม่ต้องรอรับอีเมลจริง

---

## 📡 รายการ API Endpoints (API Documentation)

ทุก Endpoint ขึ้นต้นด้วยคำนำหน้า `/api/v1`

| หมวดหมู่ | Method | Endpoint | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/send-otp` | ขอรหัส OTP ส่งไปยังอีเมล `@up.ac.th` |
| **Auth** | `POST` | `/auth/verify-otp` | ยืนยันรหัส OTP และรับ Session Token |
| **Feed** | `GET` | `/feed` | ดึงรายชื่อการ์ดนิสิตสำหรับปัด พร้อมรองรับฟิลเตอร์ |
| **Feed** | `POST` | `/swipe` | บันทึกการปัดการ์ด (`right` = Like, `left` = Pass) |
| **Feed** | `GET` | `/who-likes-me` | ดึงรายชื่อคนที่มากดถูกใจเรา |
| **Profile** | `GET` | `/me` | ดึงข้อมูลโปรไฟล์ของตนเอง |
| **Profile** | `POST` | `/profile` | อัปเดตข้อมูลส่วนตัวและอัปโหลดรูปภาพ 9 ช่อง |
| **Profile** | `GET` | `/user/:email` | ดูข้อมูลโปรไฟล์ของนิสิตคนอื่น |
| **Matches** | `GET` | `/matches` | ดึงรายชื่อคนที่ใจตรงกัน (Mutual Matches) |
| **Chat** | `GET` | `/chats` | ดึงรายการห้องสนทนาทั้งหมดพร้อมข้อความล่าสุด |
| **Chat** | `GET` | `/chat/:target_email` | ดึงประวัติข้อความในห้องแชท |
| **Chat** | `POST` | `/chat/send` | ส่งข้อความหรือสติกเกอร์ GIF |
| **Chat** | `GET` | `/chat/sse` | Realtime SSE Stream สำหรับอัปเดตข้อความและการแจ้งเตือน |
| **Chat** | `POST` | `/chat/unmatch` | ยกเลิกการจับคู่บทสนทนา |
| **Push** | `GET` | `/notifications/unread-count` | สรุปจำนวนข้อความและ Match ที่ยังไม่อ่าน |
| **Push** | `GET` | `/notifications/vapid-key` | ดึง VAPID Public Key สำหรับ Subscribe Web Push |
| **Push** | `POST` | `/notifications/push-subscribe` | บันทึกข้อมูล Push Subscription ของเบราว์เซอร์ |

---

## 🔒 ความปลอดภัยและความเป็นส่วนตัว (Security Architecture)

1. **สถาปัตยกรรม Environment Variables สมบูรณ์แบบ:** ตัวแปรที่มีความสำคัญทั้งหมด (API URL, Port, Secret Salts, Database Credentials, GIPHY Key, Test Account Flags) ถูกแยกออกจากโค้ดและควบคุมผ่านไฟล์ `.env` อย่างปลอดภัย
2. **การจำกัดโดเมนอีเมลสถาบัน:** ตรวจสอบความถูกต้องของอีเมลนิสิตมหาวิทยาลัยพะเยา (`@up.ac.th`) ทั้งในระดับ Client และ Server
3. **Session Signature Verification:** ตรวจสอบลายเซ็น Cryptographic Signature บน URL และ Token Cookie ใน [middleware.ts](file:///d:/tcmg/UPER/frontend/middleware.ts) ป้องกันการขโมยลิงก์แชทไปเปิดบนอุปกรณ์อื่น
4. **ความปลอดภัยของรูปภาพ:** รูปภาพที่อัปโหลดจะถูกเปลี่ยนชื่อสุ่มด้วย Hash ป้องกันการสุ่มค้นหาชื่อไฟล์ (Direct File Enumeration)
5. **การควบคุมความสัมพันธ์:** ผู้ใช้สามารถยกเลิกการแมตช์ (Unmatch) หรือรายงานพฤติกรรมไม่เหมาะสม (Report) ได้ตลอดเวลา

---

## 👨‍💻 ผู้พัฒนาและที่มา (Authors & Credits)

- **โครงการ:** UP Match - มหาวิทยาลัยพะเยา (UP Community Project)
- **GitHub Repository:** [kimuz57/UPmatch](https://github.com/kimuz57/UPmatch)
- **Licence:** MIT License

---

<p align="center">Made with 💜 for UP Students</p>