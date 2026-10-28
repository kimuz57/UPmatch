import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Code2,
  User,
  Heart,
  MessageCircle,
  ExternalLink,
  Layers,
  Database,
  Globe,
  Mail,
  AlertTriangle,
} from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://upmatch.tcmg.me";

export const metadata: Metadata = {
  title: "เกี่ยวกับ UPyes — โครงงานเว็บหาคู่สำหรับนิสิต ม.พะเยา พัฒนาโดย Suphakit Saeyang",
  description:
    "เรียนรู้เกี่ยวกับ UPyes แพลตฟอร์มหาคู่และคอมมูนิตี้สำหรับนิสิตมหาวิทยาลัยพะเยา พัฒนาโดย Suphakit Saeyang (ศุภกิตต์ แซ่ย่าง) ดูรายละเอียดฟีเจอร์ เทคโนโลยีที่ใช้ และช่องทางติดต่อผู้พัฒนา",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "เกี่ยวกับ UPyes — โครงงานเว็บหาคู่สำหรับนิสิต ม.พะเยา พัฒนาโดย Suphakit Saeyang",
    description:
      "เรียนรู้เกี่ยวกับ UPyes แพลตฟอร์มหาคู่สำหรับนิสิตมหาวิทยาลัยพะเยา พัฒนาโดย Suphakit Saeyang (ศุภกิตต์ แซ่ย่าง) ดูรายละเอียดฟีเจอร์ เทคโนโลยีที่ใช้ และช่องทางติดต่อผู้พัฒนา",
    url: `${siteUrl}/about`,
    siteName: "UPyes",
    locale: "th_TH",
    type: "article",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "UPyes โลโก้แอปหาคู่ ม.พะเยา",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "เกี่ยวกับ UPyes — พัฒนาโดย Suphakit Saeyang",
    description:
      "โครงงานแพลตฟอร์มหาคู่สำหรับนิสิตมหาวิทยาลัยพะเยา พัฒนาโดย Suphakit Saeyang (ศุภกิตต์ แซ่ย่าง)",
    images: ["/logo.png"],
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${siteUrl}/about#webpage`,
        url: `${siteUrl}/about`,
        name: "เกี่ยวกับ UPyes — โครงงานเว็บหาคู่สำหรับนิสิต ม.พะเยา",
        description:
          "เรียนรู้เกี่ยวกับ UPyes แพลตฟอร์มหาคู่สำหรับนิสิตมหาวิทยาลัยพะเยา พัฒนาโดย Suphakit Saeyang",
        inLanguage: "th-TH",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          name: "UPyes",
          url: siteUrl,
        },
        mainEntity: {
          "@type": "SoftwareApplication",
          "@id": `${siteUrl}/#webapp`,
          name: "UPyes",
          url: siteUrl,
          applicationCategory: "SocialNetworkingApplication",
          operatingSystem: "All",
          author: {
            "@type": "Person",
            "@id": "https://tcmg.me/#person",
            name: "Suphakit Saeyang",
            alternateName: "ศุภกิตต์ แซ่ย่าง",
            url: "https://tcmg.me",
          },
        },
      },
      {
        "@type": "Person",
        "@id": "https://tcmg.me/#person",
        name: "Suphakit Saeyang",
        alternateName: ["ศุภกิตต์ แซ่ย่าง", "kitdhgiiob"],
        url: "https://tcmg.me",
        jobTitle: "Software Developer",
        sameAs: [
          "https://tcmg.me",
          "https://instagram.com/kitdhgiiob",
          "https://www.facebook.com/profile.php?id=100070998043139",
          "https://github.com/kimuz57",
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col justify-between relative z-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-slate-200/80 bg-white/85">
        <Link href="/" className="flex items-center gap-3 cursor-pointer">
          <img src="/logo.png" alt="UPyes โลโก้เว็บหาคู่ ม.พะเยา" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-950 block">
              UPyes
            </span>
            <span className="text-[10px] font-semibold text-purple-900 block">
              Just Match, The Right Person
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าแรก</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full space-y-10">
        {/* Hero Section */}
        <div className="space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200">
            <span>เกี่ยวกับโครงงาน (About UPyes)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-950 leading-tight">
            เกี่ยวกับ UPyes — โครงงานแพลตฟอร์มหาคู่สำหรับนิสิต ม.พะเยา
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            UPyes คือแพลตฟอร์มเว็บแอปพลิเคชันสำหรับทำความรู้จักและหาคู่ของนิสิตมหาวิทยาลัยพะเยา จัดทำขึ้นโดยมีเป้าหมายเพื่อสร้างพื้นที่สื่อกลางที่ปลอดภัย ไร้บัญชีปลอม และเปิดโอกาสให้นิสิตได้ค้นหาเพื่อนร่วมคณะ เพื่อนติวหนังสือ หรือพัฒนาความสัมพันธ์ไปเป็นคนรู้ใจ
          </p>
        </div>

        {/* Section 1: UPyes คืออะไร */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-left">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-purple-900 shrink-0" />
            <span>UPyes คืออะไร และสร้างขึ้นเพื่ออะไร</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            ในรั้วมหาวิทยาลัยพะเยาที่มีนิสิตหลากหลายคณะและชั้นปี การทำความรู้จักเพื่อนใหม่ข้ามคณะหรือค้นหาเพื่อนที่มีความสนใจตรงกันอาจไม่ใช่เรื่องง่ายสำหรับทุกคน UPyes จึงถูกออกแบบขึ้นมาภายใต้แนวคิด <strong>"Just Match, The Right Person"</strong> เพื่อเป็นเครื่องมือออนไลน์ที่ช่วยให้นิสิตสามารถเชื่อมต่อถึงกันได้อย่างเป็นกันเอง สะดวกสบาย และปลอดภัย
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            ระบบทำงานบนเว็บเบราว์เซอร์อย่างเต็มรูปแบบ ไม่จำเป็นต้องดาวน์โหลดผ่านแอปสโตร์ นิสิตสามารถใช้งานได้ฟรีโดยยืนยันตัวตนผ่านระบบรหัส OTP ที่ส่งตรงถึงอีเมลทางการของสถาบัน (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-purple-950 font-semibold">@up.ac.th</code>) ทำให้มั่นใจได้ว่าทุกคนในระบบเป็นนิสิตตัวจริง 100%
          </p>
        </section>

        {/* Section 2: ฟีเจอร์การทำงานจริงของระบบ */}
        <section className="space-y-4 text-left">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-purple-900 shrink-0" />
            <span>ฟีเจอร์หลักของระบบ UPyes</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-900" />
                <span>ยืนยันตัวตนผ่าน OTP อีเมลสถาบัน</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                เข้าสู่ระบบด้วยรหัส OTP 6 หลักส่งถึง Outlook Webmail (@up.ac.th) โดยไม่ต้องกรอกรหัสผ่านอีเมลส่วนตัว ปลอดภัยและคัดกรองเฉพาะนิสิตในสถาบัน
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-4 h-4 text-purple-900" />
                <span>ระบบค้นหาและปัดการ์ด (Swipe & Match)</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ดูโปรไฟล์ รูปภาพ คณะ ชั้นปี และไลฟ์สไตล์ของเพื่อนๆ ปัดขวาเพื่อถูกใจ หรือปัดซ้ายเพื่อข้าม เมื่อใจตรงกันทั้งสองฝ่าย ระบบจะจับคู่ (Match) ให้ทันที
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-900" />
                <span>ห้องแชทแบบเรียลไทม์ (Real-time Chat)</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                เมื่อแมตช์แล้วสามารถเปิดบทสนทนาได้ทันทีผ่านระบบ WebSocket พร้อมฟังก์ชันส่งสติกเกอร์ GIF ค้นหาและข้อความทักทายเริ่มต้นแบบเป็นกลาง
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-900" />
                <span>การจัดการโปรไฟล์และความปลอดภัย</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                อัปโหลดรูปภาพได้สูงสุด 9 ช่อง พร้อมระบุ MBTI แคปชั่น และข้อมูลคณะ พร้อมปุ่มบล็อก (Block) และรายงาน (Report) ผู้ใช้เพื่อความปลอดภัย
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: ใครเป็นผู้พัฒนา UPyes */}
        <section className="p-6 rounded-2xl bg-white border border-purple-200 shadow-2xs space-y-4 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950">
                ใครเป็นผู้พัฒนา UPyes
              </h2>
              <p className="text-xs text-purple-900 font-semibold">Creator & Software Developer</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            <p>
              เว็บไซต์ UPyes ได้รับการริเริ่ม ออกแบบ และพัฒนาขึ้นโดย <strong>Suphakit Saeyang (ศุภกิตต์ แซ่ย่าง)</strong> ซึ่งเป็นนิสิตผู้พัฒนาซอฟต์แวร์อิสระ โดยมีจุดประสงค์หลักเพื่อฝึกฝนและพัฒนาทักษะด้าน Software Engineering, Full-Stack Web Development, สถาปัตยกรรมระบบ และความปลอดภัยของข้อมูล
            </p>
            <p>
              ผู้พัฒนาเป็นผู้รับผิดชอบการสร้างระบบทั้งหมด ตั้งแต่การออกแบบ UI/UX, การพัฒนาระบบฝั่ง Frontend, การเขียน API เซิร์ฟเวอร์ฝั่ง Backend ตลอดจนการออกแบบฐานข้อมูลและการวางระบบเครือข่าย
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="https://tcmg.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
            >
              <Globe className="w-4 h-4" />
              <span>เยี่ยมชม Portfolio ผู้พัฒนา: tcmg.me</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="mailto:67024942@up.ac.th"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              <Mail className="w-4 h-4 text-purple-900" />
              <span>ติดต่อผู้พัฒนา: 67024942@up.ac.th</span>
            </a>
          </div>
        </section>

        {/* Section 4: เทคโนโลยีที่ใช้พัฒนา (Tech Stack) */}
        <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 text-left">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Database className="w-5 h-5 text-purple-900 shrink-0" />
            <span>เทคโนโลยีที่ใช้พัฒนา (Technical Architecture)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">Frontend</span>
              <p className="leading-relaxed">
                Next.js 16 (React 19), App Router, Tailwind CSS, Lucide Icons, Framer Motion
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">Backend & API</span>
              <p className="leading-relaxed">
                Go (Golang) พร้อม Fiber Framework, RESTful Architecture, WebSocket Real-time Engine
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block text-xs">Database & Security</span>
              <p className="leading-relaxed">
                PostgreSQL Database, Cookie-based Token Session, SMTP OTP Integration, X-Robots Security
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: ข้อจำกัดความรับผิดชอบ (Disclaimer) */}
        <section className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-left">
          <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
            <span>ข้อจำกัดความรับผิดชอบและการไม่มีส่วนเกี่ยวข้องกับสถาบัน (Disclaimer)</span>
          </h2>
          <p className="text-xs text-amber-900 leading-relaxed font-normal">
            เว็บไซต์ UPyes เป็นโครงงานอิสระที่พัฒนาขึ้นโดยนิสิตเพื่อการศึกษาและพัฒนาทักษะทางเทคโนโลยีเท่านั้น <strong>ไม่มีความเกี่ยวข้อง ไม่ได้รับการสนับสนุน และไม่ได้ดำเนินการอย่างเป็นทางการโดยมหาวิทยาลัยพะเยา (University of Phayao)</strong> ผู้พัฒนาไม่มีส่วนเกี่ยวข้องและไม่รับผิดชอบต่อพฤติกรรม ข้อพิพาท หรือความเสียหายใดๆ ที่เกิดขึ้นระหว่างผู้ใช้งาน โปรดใช้วิจารณญาณส่วนบุคคลในการติดต่อสื่อสาร
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-slate-500 border-t border-slate-200/80 bg-white/80 relative z-10">
        <div className="max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-bold text-slate-700">
            UPyes • Just Match, The Right Person
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <Link href="/" className="hover:text-purple-900 font-semibold underline underline-offset-2">
              หน้าแรก
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/about" className="hover:text-purple-900 font-semibold underline underline-offset-2">
              เกี่ยวกับ UPyes
            </Link>
            <span className="text-slate-300">•</span>
            <span>พัฒนาโดย <a href="https://tcmg.me" target="_blank" rel="noopener noreferrer" className="font-bold text-purple-900 hover:underline">Suphakit Saeyang</a></span>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            © 2026 UPyes Student Project. Developed by Suphakit Saeyang. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
