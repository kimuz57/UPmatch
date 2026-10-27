// frontend/app/page.tsx
// avoid-ai-design-ignore: C2
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // ดักจับตอนโหลดหน้าเว็บเพื่อเช็ก Session Token
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
      router.push("/swipe");
    } else {
      setIsCheckingSession(false);
    }
  }, [router]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent relative z-10">
        <div className="flex flex-col items-center gap-3">
          <Heart className="w-8 h-8 text-purple-900 animate-pulse fill-purple-900" />
          <p className="text-slate-600 font-medium text-xs tracking-wide">กำลังเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

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
          <img src="/logo.png" alt="UP Match" className="w-14 h-14" />
          <div>
            <span className="text-lg font-black tracking-tight text-slate-950">
              UP Match
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12]">
              พื้นที่ทำความรู้จักเพื่อนใหม่ ในรั้วมหาวิทยาลัยพะเยา
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              UP Match ออกแบบมาเพื่อสังคมนิสิต ม.พะเยา โดยเฉพาะ ปลอดภัยด้วยการล็อกอินผ่าน OTP อีเมลสถาบัน ไม่มีบัญชีปลอม ค้นหาเพื่อนร่วมคณะ เพื่อนติวหนังสือ หรือคนรู้ใจ
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                onClick={() => setShowAuth(true)}
                className="px-7 py-3.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-base shadow-xs transition active:scale-[0.99] cursor-pointer text-center"
              >
                เริ่มต้นใช้งาน UP Match
              </button>
              <span className="text-xs text-slate-500 font-medium self-center sm:self-auto">
                ใช้งานฟรีสำหรับนิสิตทุกชั้นปี
              </span>
            </div>
          </div>

          {/* Right Column: Campus Mock Card */}
          <div className="lg:col-span-5 flex justify-center">
            <img src="/jpg.jpg" alt="UP Match Community" />
          </div>

        </div>

        {/* Feature Grid */}
        <div className="mt-16 pt-12 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">ยืนยันตัวตนนิสิต 100%</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              เข้าสู่ระบบด้วยรหัส OTP ส่งตรงถึงอีเมลสถาบัน ปลอดภัยและปราศจากบัญชีปลอม
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">คัดกรองตามคณะและชั้นปี</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              ทำความรู้จักเพื่อนจากคณะที่สนใจ หรือค้นหาเพื่อนสายรหัสและชั้นปีเดียวกัน (ยังทำไม่เสร็จ)
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">ใจตรงกัน เริ่มคุยได้ทันที</h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              เมื่อกดถูกใจตรงกัน ระบบจะเปิดห้องแชทให้เริ่มบทสนทนาและส่ง GIF ได้ทันที
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 px-4 text-center text-slate-500 border-t border-slate-200/80 bg-white/80 relative z-10">
        <div className="max-w-3xl mx-auto space-y-2.5">
          <p className="text-xs font-bold text-slate-700">
            UP Match • Just Match, The Right Person
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
            <strong className="font-semibold text-slate-700">ข้อจำกัดความรับผิดชอบ (Disclaimer):</strong> เว็บไซต์ UP Match เป็นโครงงานอิสระที่พัฒนาขึ้นโดยนิสิตเพื่อการศึกษาและพัฒนาทักษะการทำเว็บแอปพลิเคชันเท่านั้น <strong className="font-semibold text-slate-700">ไม่มีความเกี่ยวข้อง ดำเนินการ หรือได้รับการรับรองอย่างเป็นทางการจากมหาวิทยาลัยพะเยา</strong> ผู้พัฒนาไม่มีส่วนเกี่ยวข้องและไม่รับผิดชอบต่อพฤติกรรม ข้อพิพาท หรือความเสียหายใดๆ ที่เกิดขึ้นระหว่างผู้ใช้งาน โปรดใช้ความระมัดระวังในการสนทนาและปกป้องข้อมูลส่วนบุคคลของท่าน
          </p>
          <p className="text-[10px] text-slate-400">
            © 2026 UP Match Student Project. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}