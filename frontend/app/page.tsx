// frontend/app/page.tsx
// avoid-ai-design-ignore: C2
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HeartHandshake,
  ShieldCheck,
  Users,
  MessageCircle,
  Heart,
  GraduationCap,
} from "lucide-react";
import AuthPage from "../components/AuthPage";

export default function LandingPage() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);

  // ดักจับตอนโหลดหน้าเว็บเพื่อเช็ก Session Token หรือ Referral Code
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
      return "";
    };

    // ดักจับ Referral Code จาก URL เช่น ?ref=REF_...
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get("ref");
      if (refParam) {
        sessionStorage.setItem("upmatch_referral_code", refParam);
        localStorage.setItem("upmatch_referral_code", refParam);
      }
    }

    const token = getCookie("up_match_token");
    if (token) {
      router.replace("/swipe");
    }
  }, [router]);

  if (showAuth) {
    return (
      <AuthPage
        onBack={() => setShowAuth(false)}
        onLoginSuccess={(user: unknown) => {
          console.log("Logged in user:", user);
          window.location.href = "/onboarding";
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col justify-between relative z-10 overflow-x-hidden">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200/80 bg-white/85">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="UPmatch โลโก้เว็บหาคู่ ม.พะเยา" className="w-14 h-14" />
          <div>
            <span className="text-lg font-black tracking-tight text-slate-950">
              UPmatch
            </span>
            <span className="block text-[11px] font-semibold text-purple-900">
              Just Match, The Right Person
            </span>
          </div>
        </div>
      </header>

      {/* Main Content: Asymmetric Editorial Grid */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 md:py-16 w-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 text-left space-y-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 leading-snug">
              UPmatch — เว็บหาคู่ ม.พะเยา พื้นที่หาเพื่อน หาแฟน และหาคนคุยสำหรับนิสิต
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              UPmatch คือแพลตฟอร์มหาคู่สำหรับนิสิตมหาวิทยาลัยพะเยา ใช้งานฟรี ปลอดภัยด้วยการยืนยันตัวตนผ่าน OTP ด้วยอีเมลสถาบัน @up.ac.th ปราศจากบัญชีปลอม เปิดโอกาสให้คุณได้ค้นหาเพื่อนร่วมคณะ หาคนคุย ติวหนังสือ หรือพัฒนาความสัมพันธ์ไปเป็นคนรู้ใจ
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                onClick={() => setShowAuth(true)}
                className="px-7 py-3.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-base shadow-xs transition active:scale-[0.99] cursor-pointer text-center"
              >
                เริ่มต้นใช้งาน UPmatch ฟรี
              </button>
              <span className="text-xs text-slate-500 font-medium self-center sm:self-auto">
                เว็บหาคู่ฟรีสำหรับนิสิต ม.พะเยา ทุกชั้นปี
              </span>
            </div>
          </div>

          {/* Right Column: Campus Mock Card */}
          <div className="lg:col-span-5 flex justify-center">
            <img src="/jpg.jpg" alt="UPmatch ตัวอย่างหน้าต่างค้นหาและปัดการ์ดหาคู่สำหรับนิสิต ม.พะเยา" />
          </div>

        </div>

        {/* Feature Grid */}
        <div className="mt-16 pt-12 border-t border-slate-200">
          <div className="mb-8 text-left">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block mb-1">
              ฟีเจอร์เด่นของแพลตฟอร์ม
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              ทำไมต้องเลือก UPmatch เว็บหาคู่สำหรับนิสิต ม.พะเยา
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">ยืนยันตัวตนนิสิต 100%</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                เข้าสู่ระบบด้วยรหัส OTP ส่งตรงถึงอีเมลสถาบัน @up.ac.th มั่นใจ ปลอดภัย และไร้บัญชีปลอม
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">คัดกรองตามคณะและชั้นปี</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                ทำความรู้จักเพื่อนจากคณะที่สนใจ หรือค้นหาเพื่อนสายรหัสและชั้นปีเดียวกันใน ม.พะเยา
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">แมตช์ฟรี เริ่มคุยได้ทันที</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                เมื่อกดถูกใจตรงกัน ระบบจะเปิดห้องแชทให้เริ่มบทสนทนาและส่ง GIF ได้ทันที ไม่มีค่าใช้จ่าย
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8 px-4 text-center text-slate-500 border-t border-slate-200/80 bg-white/80 relative z-10">
        <div className="max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-bold text-slate-700">
            UP Match • Just Match, The Right Person
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
            <strong className="font-semibold text-slate-700">ข้อจำกัดความรับผิดชอบ (Disclaimer):</strong> เว็บไซต์ UP Match เป็นโครงงานอิสระที่พัฒนาขึ้นโดยนิสิตเพื่อการศึกษาและพัฒนาทักษะการทำเว็บแอปพลิเคชันเท่านั้น <strong className="font-semibold text-slate-700">ไม่มีความเกี่ยวข้อง ดำเนินการ หรือได้รับการรับรองอย่างเป็นทางการจากมหาวิทยาลัยพะเยา</strong> ผู้พัฒนาไม่มีส่วนเกี่ยวข้องและไม่รับผิดชอบต่อพฤติกรรม ข้อพิพาท หรือความเสียหายใดๆ ที่เกิดขึ้นระหว่างผู้ใช้งาน โปรดใช้ความระมัดระวังในการสนทนาและปกป้องข้อมูลส่วนบุคคลของท่าน
          </p>

          <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
            <Link
              href="/about"
              className="text-purple-900 hover:text-purple-950 font-bold hover:underline"
            >
              เกี่ยวกับ UPmatch
            </Link>
            <span className="text-slate-300">•</span>
            <span>
              พัฒนาโดย{" "}
              <a
                href="https://tcmg.me"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-purple-900 hover:text-purple-950 hover:underline"
              >
                Suphakit Saeyang
              </a>
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700">ติดต่อ:</span>
            <a
              href="mailto:67024942@up.ac.th"
              className="text-purple-900 hover:text-purple-950 hover:underline font-medium"
            >
              67024942@up.ac.th
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://instagram.com/kitdhgiiob"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-900 hover:text-purple-950 hover:underline font-medium"
            >
              IG: @kitdhgiiob
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://www.facebook.com/profile.php?id=100070998043139"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-900 hover:text-purple-950 hover:underline font-medium"
            >
              Facebook
            </a>
          </div>

          <p className="text-[10px] text-slate-400 pt-1">
            © 2026 UPmatch Student Project. Developed by Suphakit Saeyang. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}