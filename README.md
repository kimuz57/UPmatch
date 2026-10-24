# 💜 UP Match - เว็บแอปพลิเคชันหาเพื่อน & คนรู้ใจ นิสิตมหาวิทยาลัยพะเยา

<p align="center">
  <img src="frontend/public/logo.png" alt="UP Match Logo" width="140" style="border-radius: 24px; box-shadow: 0 10px 25px rgba(168, 85, 247, 0.25);" />
</p>

<p align="center">
  <b>"ค้นหาเพื่อนใหม่ คนรู้ใจ และคอมมูนิตี้เด็ก มพ. ในแบบที่คุณเป็น"</b><br/>
  แอปพลิเคชันจับคู่และสังคมออนไลน์ที่ออกแบบมาเพื่อนิสิตมหาวิทยาลัยพะเยาโดยเฉพาะ รวดเร็ว ปลอดภัย และใช้งานได้บนทุกอุปกรณ์
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

## ✨ ไฮไลท์และฟีเจอร์เด่น (Key Features)

### 1. 🎓 ระบบคัดกรองนิสิต มพ. แท้ 100% (UP Student Verification)
- เข้าสู่ระบบด้วยอีเมลนิสิตมหาวิทยาลัยพะเยา (`@up.ac.th`)
- ส่งรหัส OTP ยืนยันตัวตนแบบใช้ครั้งเดียวผ่าน SMTP Email Service
- ตรวจจับคณะและชั้นปีอัตโนมัติจากรหัสนิสิต 8 หลัก

### 2. 🃏 ฟีดการ์ดปัดหาเพื่อนสุดลื่นไหล (Tinder-Style Swipe Deck)
- ปัดขวาเพื่อ **ถูกใจ (Like)**, ปัดซ้ายเพื่อ **ข้าม (Pass)** และปุ่ม **Super Like**
- คัดกรองเพศที่ต้องการพบ (ชาย, หญิง, หรือทุกคน) และคณะที่สนใจ
- ตรวจสอบประวัติการปัด ไม่แสดงคนเดิมซ้ำ และไม่แสดงโปรไฟล์ของตนเอง

### 3. 🖼️ ระบบจัดการรูปภาพ 9 ช่องสไตล์ Tinder (9-Slot Photo Manager)
- อัปโหลดและจัดเก็บรูปภาพโปรไฟล์ได้สูงสุด 9 รูป
- **Drag & Drop:** กดค้างแล้วลากเพื่อสลับตำแหน่งรูปภาพได้อย่างอิสระ
- **One-Tap Replace:** แตะรูปเดิมเพื่อเลือกลบและแทนที่ด้วยรูปใหม่ได้ทันที
- **Add Slots:** แตะช่องว่างเพื่อเพิ่มรูปภาพใหม่เข้าสู่แกลเลอรี

### 4. 💬 แชทเรียลไทม์ผ่าน SSE (Server-Sent Events)
- สื่อสารแบบ Real-time ทันทีที่เกิดการ Match กัน
- รองรับการส่งข้อความ และค้นหาคลังสติกเกอร์ GIF
- แสดงสถานะข้อความอ่านแล้ว (Read Receipts)
- มีระบบรายงานผู้ใช้ (Report) และยกเลิกการจับคู่ (Unmatch) เพื่อความปลอดภัย

### 5. 🎉 แจ้งเตือนใจตรงกัน (Mutual Match Celebration)
- เมื่อกดไลก์ตรงกัน ระบบจะแสดงหน้าต่างเฉลิมฉลอง Match ทันทีทั้งสองฝั่งพร้อมกัน
- สร้างเสียงสังเคราะห์ต้อนรับผ่าน **Web Audio API** (ไม่ต้องพึ่งพาไฟล์เสียงภายนอก)
- แสดงเอฟเฟกต์ละอองพลุหลากสีสัน (Confetti Celebration)

### 6. 📲 รองรับ PWA & Web Push Notification (จอดับ/พับหน้าจอ)
- ติดตั้งเป็นแอปบนหน้าจอมือถือได้ทันที (Add to Home Screen ทั้ง iOS และ Android)
- รองรับมาตรฐาน **VAPID Web Push Protocol** ทำงานคู่กับ Service Worker
- ได้รับการแจ้งเตือนข้อความใหม่และ Match ใหม่ แม้ในขณะพับหน้าจอหรือจอดับอยู่ (รองรับ iOS 16.4+ และ Android)

### 7. 📱💻 ระบบแสดงผล Responsive อัจฉริยะ (Adaptive Device Mode)
- **Mobile Mode:** ปรับสเกลเต็มจอ ขอบโค้งมนกระชับมือ เหมาะสำหรับสมาร์ตโฟนและ iPad ในแนวตั้ง
- **Desktop Mode:** จัดวางหน้าจอแบ่งฝั่งซ้าย-ขวา พร้อม Sidebar และการ์ดควบคุมสำหรับหน้าจอ PC และ iPad ในแนวนอน

### 8. 💖 พื้นหลังฟองสบู่หัวใจ (Floating Hearts Animated Background)
- ฟองสบู่รูปหัวใจและดวงแสงพาสเทลเคลื่อนไหวตลอดเวลาแบบ Seamless ทุกหน้า
- สร้างบรรยากาศที่อบอุ่นและมีชีวิตชีวาเข้ากับคอนเซปต์แอปหาเพื่อน

---

## 🛠️ สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack)

```
UPER/
├── frontend/             # Next.js 16 (App Router) + React 19 + Tailwind v4 + Framer Motion
└── backend/              # Go (Golang) + Fiber v2 + GORM + PostgreSQL + Redis
```

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (Turbopack, App Router)
- **Library:** [React 19](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **PWA & Push:** Service Worker (`sw.js`), Web App Manifest, Notification API & PushManager
- **Audio & Effects:** Web Audio API (Synthesizer), Canvas Confetti

### Backend
- **Language:** [Go (Golang 1.26)](https://golang.org/)
- **HTTP Engine:** [Fiber v2](https://gofiber.io/) (Fast HTTP Framework บน Fasthttp)
- **ORM:** [GORM](https://gorm.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (Gorm Driver)
- **Cache & Session:** [Redis](https://redis.io/)
- **Real-time Engine:** Server-Sent Events (SSE) Client Channel Pool Hub
- **Web Push Protocol:** [webpush-go](https://github.com/SherClockHolmes/webpush-go) (VAPID Specification RFC 8292)
- **Mailer:** Go SMTP Client พร้อม TLS Authentication

---

## 📂 โครงสร้างไดเรกทอรีของโปรเจกต์ (Project Structure)

```text
UPER/
├── backend/
│   ├── config/             # การตั้งค่าฐานข้อมูล, Redis และเส้นทาง Storage
│   │   ├── database.go     # เชื่อมต่อ PostgreSQL และ Auto-Migrate Models
│   │   ├── redis.go        # เชื่อมต่อ Redis Client
│   │   └── storage.go      # กำหนดพาธการจัดเก็บไฟล์อัปโหลด
│   ├── controllers/        # ตัวควบคุมตรรกะทางธุรกิจ (Business Logic)
│   │   ├── auth_controller.go         # ขอและยืนยันรหัส OTP
│   │   ├── chat_controller.go         # แชท, SSE Hub, ดึงประวัติ, Unmatch
│   │   ├── feed_controller.go         # ฟีดผู้ใช้ที่ตรงกับสเปก
│   │   ├── interaction_controller.go  # การปัด (Like/Pass), Who-likes-me
│   │   ├── notification_controller.go # นับข้อความที่ยังไม่อ่าน, จัดการ Push
│   │   └── profile_controller.go      # จัดการข้อมูลส่วนตัว, รูป 9 ช่อง
│   ├── models/             # GORM Data Schemas
│   │   ├── user.go         # ข้อมูลโปรไฟล์นิสิต
│   │   ├── interaction.go  # บันทึกการปัดและสถานะ Match
│   │   ├── chat.go         # ข้อความแชท
│   │   └── notification.go # ข้อมูลการลงทะเบียน Web Push Subscription
│   ├── routes/             # การลงทะเบียน API Endpoints
│   ├── utils/              # ตัวช่วยส่งอีเมล OTP และ Web Push
│   ├── uploads/            # พื้นที่จัดเก็บรูปภาพโปรไฟล์ของผู้ใช้
│   ├── .env.example        # ตัวอย่างการกำหนดตัวแปรสภาพแวดล้อม
│   └── main.go             # จุดเริ่มต้นการทำงานของ Backend Server
│
├── frontend/
│   ├── app/                # Next.js App Router (หน้าเว็บทั้งหมด)
│   │   ├── page.tsx        # หน้า Landing Page & ตรวจสอบ Session
│   │   ├── swipe/          # หน้าฟีดการ์ดปัดหาเพื่อน
│   │   ├── chat/           # หน้ารวมบทสนทนา & ห้องแชท (/chat/[id])
│   │   ├── matches/        # หน้าแสดงรายการคนที่ใจตรงกัน
│   │   ├── likes/          # หน้าแสดงคนที่กดถูกใจเรา (Who Likes Me)
│   │   ├── profile/        # หน้าโปรไฟล์ส่วนตัว, ตั้งค่า, จัดการรูป 9 ช่อง
│   │   ├── onboarding/     # หน้าแบบสอบถามตั้งค่าโปรไฟล์สำหรับผู้ใช้ใหม่
│   │   ├── layout.tsx      # โครงสร้าง Layout หลัก + ติดตั้งพื้นหลังสากล
│   │   └── globals.css     # Design Tokens, CSS Reset และธีมหลัก
│   ├── components/         # คอมโพเนนต์ UI ที่ใช้ซ้ำ
│   │   ├── AuthPage.jsx                 # หน้าต่างกรอกอีเมลและรหัส OTP
│   │   ├── FloatingHeartsBackground.jsx # แอนิเมชันฟองสบู่หัวใจลอยรอบแอป
│   │   ├── GlobalNotification.jsx       # แถบแจ้งเตือน Toast + เสียง + WebPush
│   │   ├── Navbar.jsx                   # แถบนำทางพร้อมตัวนับ Badge ข้อความ
│   │   └── ProfileDetailModal.jsx       # หน้าต่างป๊อปอัปดูข้อมูลโปรไฟล์เต็ม
│   ├── public/
│   │   ├── manifest.json   # เว็บแอปพลิเคชันแมนิเฟสต์สำหรับ PWA
│   │   ├── sw.js           # Service Worker สำหรับดักจับ Background Push
│   │   └── logo.png        # โลโก้แอปพลิเคชัน
│   ├── utils/              # ตัวช่วยจัดการ Cookie, Session, API Base URL
│   └── middleware.ts       # ป้องกันเส้นทางที่ต้องล็อกอินก่อนเข้าใช้งาน
│
├── .gitignore              # ละเว้นไฟล์ build, env, tmp และ uploads จาก Git
└── README.md               # เอกสารประกอบการใช้งานโปรเจกต์
```

---

## 🚀 วิธีการติดตั้งและรันในเครื่อง (Getting Started)

### 1. ความต้องการของระบบ (Prerequisites)
- [Node.js](https://nodejs.org/) (เวอร์ชัน 18.x หรือ 20.x ขึ้นไป)
- [Go (Golang)](https://go.dev/) (เวอร์ชัน 1.22 หรือใหม่กว่า)
- [PostgreSQL](https://www.postgresql.org/) (พอร์ตค่าเริ่มต้น 5432 หรือ 5433)
- [Redis](https://redis.io/) (พอร์ตค่าเริ่มต้น 6379)

---

### 2. การตั้งค่าฝั่ง Backend (Go)

1. เข้าไปยังโฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```

2. คัดลอกไฟล์ `.env.example` เป็น `.env`:
   ```bash
   cp .env.example .env
   ```

3. แก้ไขค่าใน `.env` ให้ตรงกับระบบของคุณ:
   ```env
   # การส่งอีเมล OTP ผ่าน Gmail SMTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-google-app-password

   # ฐานข้อมูล PostgreSQL
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=upmatch
   DB_PORT=5433

   # แคช Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=1

   # VAPID Keys สำหรับ Web Push Notifications
   VAPID_PUBLIC_KEY=BKv9oOXXiRNmJEuoYDZ0GpduxCgAabgeoXxqEoZtwMX14odoTySGkchhwGitGTsC-0BZ_EmDn_6bC1foUSZiVr4
   VAPID_PRIVATE_KEY=X52gLYl8ASUA2mVjwynucWT-juTsB3qn6yowkpr47Gc
   VAPID_SUBJECT=mailto:your-email@gmail.com
   ```

4. ดาวน์โหลด Dependencies และเริ่มรันเซิร์ฟเวอร์:
   ```bash
   go mod download
   go run main.go
   # หรือใช้ air สำหรับ Hot Reload
   air
   ```
   > Backend พร้อมทำงานที่: `http://localhost:8080`

---

### 3. การตั้งค่าฝั่ง Frontend (Next.js)

1. เข้าไปยังโฟลเดอร์ `frontend`:
   ```bash
   cd frontend
   ```

2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```

3. เริ่มต้น Development Server:
   ```bash
   npm run dev
   ```
   > Frontend พร้อมทำงานที่: `http://localhost:3003`

---

## 📡 รายการ API Endpoints (API Documentation)

ทุก Endpoint เริ่มต้นด้วยคำนำหน้า `/api/v1`

| หมวดหมู่ | Method | Endpoint | คำอธิบาย |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/send-otp` | ขอรหัส OTP ไปยังอีเมล `@up.ac.th` |
| **Auth** | `POST` | `/auth/verify-otp` | ยืนยันรหัส OTP และรับ Session Token |
| **Feed** | `GET` | `/feed` | ดึงรายชื่อนิสิตที่ตรงกับเงื่อนไขการค้นหา |
| **Feed** | `POST` | `/swipe` | บันทึกการปัดการ์ด (`like`, `pass`, `super_like`) |
| **Feed** | `GET` | `/who-likes-me` | ดูรายชื่อคนที่กดถูกใจโปรไฟล์ของเรา |
| **Profile** | `GET` | `/me` | ดึงข้อมูลโปรไฟล์ของตนเอง |
| **Profile** | `POST` | `/profile` | อัปเดตข้อมูลส่วนตัวและรูปภาพโปรไฟล์ |
| **Profile** | `GET` | `/user/:email` | ดูข้อมูลโปรไฟล์แบบเจาะจงรายบุคคล |
| **Matches** | `GET` | `/matches` | ดึงรายชื่อคนที่ใจตรงกัน (Mutual Matches) |
| **Chat** | `GET` | `/chats` | ดึงรายชื่อห้องสนทนาทั้งหมด |
| **Chat** | `GET` | `/chat/:target_email` | ดึงประวัติข้อความในห้องแชท |
| **Chat** | `POST` | `/chat/send` | ส่งข้อความหรือสติกเกอร์ GIF |
| **Chat** | `GET` | `/chat/sse` | สตรีมเหตุการณ์ข้อความและการแจ้งเตือนแบบเรียลไทม์ |
| **Chat** | `POST` | `/chat/unmatch` | ยกเลิกการจับคู่บทสนทนา |
| **Push** | `GET` | `/notifications/unread-count` | สรุปจำนวนข้อความและ Match ใหม่ที่ยังไม่ได้อ่าน |
| **Push** | `GET` | `/notifications/vapid-key` | ดึง Public Key สำหรับเบราว์เซอร์ Subscribe Push |
| **Push** | `POST` | `/notifications/push-subscribe` | บันทึกข้อมูล PushSubscription ของอุปกรณ์ |

---

## 🔒 ความปลอดภัยและความเป็นส่วนตัว (Security)

1. **การจำกัดโดเมน:** อนุญาตให้นิสิตที่มีอีเมลภายใต้โดเมน `@up.ac.th` เท่านั้นที่สามารถลงทะเบียนเข้าใช้งานได้
2. **Session Signature Verification:** Middleware มีการสร้างและตรวจสอบลายเซ็นการเข้ารหัส (Cryptographic Token) ป้องกันการนำลิงก์แชทไปเปิดข้ามบัญชี
3. **การปกป้องข้อมูลรูปภาพ:** รูปภาพที่อัปโหลดจะถูกสร้างชื่อแบบสุ่มพร้อมแฮชเวลาเพื่อป้องกันการเข้าถึงไฟล์โดยตรงแบบคาดเดา
4. **การควบคุมการจับคู่:** ผู้ใช้สามารถยกเลิกการแมตช์ (Unmatch) หรือกดรายงาน (Report) บัญชีที่ไม่เหมาะสมได้ตลอดเวลา

---

## 👨‍💻 ผู้พัฒนาและที่มา (Authors & Credits)

- **โครงการ:** UP Match - มหาวิทยาลัยพะเยา (UP Community Project)
- **GitHub Repository:** [kimuz57/UPmatch](https://github.com/kimuz57/UPmatch)
- **Contact:** ติดต่อนักพัฒนาผ่านทางอีเมลของระบบหรือเปิด GitHub Issues

---

<p align="center">Made with 💜 for UP Students</p>