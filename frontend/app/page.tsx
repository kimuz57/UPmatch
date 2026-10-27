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
          <div className="w-10 h-10 rounded-xl bg-purple-900 flex items-center justify-center text-white shadow-xs">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-950">
              UP Match
            </span>
            <span className="block text-[11px] font-semibold text-purple-900">
              มหาวิทยาลัยพะเยา
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAuth(true)}
          className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-xs font-semibold transition cursor-pointer shadow-xs active:scale-[0.98]"
        >
          เข้าสู่ระบบ
        </button>
      </header>

      {/* Main Content: Asymmetric Editorial Grid */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 md:py-16 w-full flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200">
              <ShieldCheck className="w-4 h-4 text-purple-900 shrink-0" />
              <span>ยืนยันตัวตนด้วยอีเมล @up.ac.th</span>
            </div>

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
            <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-slate-900">
                <img
                  src="/logo.png"
                  alt="UP Match Community"
                  className="w-full h-full object-cover p-8 bg-purple-950"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black">ฟ้าใส, 20</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-900 text-white text-[10px] font-bold">
                      ICT ม.พะเยา
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2">
                    หาเพื่อนกินหมูกระทะหน้ามอ และเพื่อนอ่านหนังสือหอสมุด
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-semibold">คณะ</span>
                  <span className="font-bold text-slate-900">เทคโนโลยีสารสนเทศ</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-semibold">ชั้นปี</span>
                  <span className="font-bold text-slate-900">ปี 2 (รหัส 66)</span>
                </div>
              </div>
            </div>
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
              ทำความรู้จักเพื่อนจากคณะที่สนใจ หรือค้นหาเพื่อนสายรหัสและชั้นปีเดียวกัน
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

      <footer className="py-6 text-center text-xs font-normal text-slate-500 border-t border-slate-200/80 bg-white/80 relative z-10">
        UP Match • คอมมูนิตี้สังคมออนไลน์สำหรับนิสิตมหาวิทยาลัยพะเยา
      </footer>
    </div>
  );
}