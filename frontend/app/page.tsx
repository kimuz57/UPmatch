// frontend/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  HeartHandshake,
  ShieldCheck,
  Users,
  MessageCircleHeart,
  ArrowRight,
  Heart,
} from "lucide-react";
import AuthPage from "../components/AuthPage";


export default function LandingPage() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // ✅ ดักจับตอนโหลดหน้าเว็บเพื่อเช็ก Session Token
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift() || "";
      return "";
    };

    const token = getCookie("up_match_token");
    
    if (token) {
      // ถ้ามี Token ค้างอยู่ในระบบ ให้เปลี่ยนหน้าไป /swipe ทันที
      router.push("/swipe");
    } else {
      // ถ้าไม่มี Token ก็ปิดหน้าโหลด ให้แสดงหน้าแรกปกติ
      setIsCheckingSession(false);
    }
  }, [router]);

  // แสดงหน้าจอโหลดระหว่างเช็ก Token ป้องกัน UI กระพริบ
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="flex flex-col items-center gap-3">
          <Heart className="w-10 h-10 text-purple-400 animate-pulse fill-purple-400" />
          <p className="text-purple-600 font-bold text-sm">กำลังพาเข้าสู่ระบบ...</p>
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
    <div className="min-h-screen bg-transparent text-slate-800 flex flex-col justify-between relative overflow-x-hidden">


      {/* Navbar ด้านบน */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-400 to-pink-400 flex items-center justify-center text-white shadow-md shadow-purple-200">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-800">
              UP Match
            </span>
            <span className="block text-[11px] font-bold text-purple-500">
              University of Phayao Community
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAuth(true)}
          className="px-4 py-2 rounded-xl bg-purple-100/80 hover:bg-purple-200 border border-purple-200 text-xs font-bold text-purple-700 backdrop-blur-md transition cursor-pointer"
        >
          เข้าสู่ระบบ (@up.ac.th)
        </button>
      </header>

      {/* ส่วนเนื้อหาหลักตรงกลาง (Hero Section) */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 my-10">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl leading-tight text-slate-800">
          หาเพื่อน หาคนคุย <br />
          <span className="bg-gradient-to-r from-purple-500 to-pink-400 bg-clip-text text-transparent">
            ในรั้วมหาวิทยาลัยพะเยา
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed font-medium">
          ไม่ว่าจะหาเพื่อนกินหมูกระทะหน้ามอ หาเพื่อนติวหนังสือ หรือหาคนรู้ใจ
          ปลอดภัยและมั่นใจเพราะยืนยันตัวตนด้วยอีเมลนิสิต{" "}
          <span className="text-purple-600 font-bold">@up.ac.th</span> เท่านั้น
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => setShowAuth(true)}
            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white font-black text-base sm:text-lg shadow-xl shadow-purple-200 flex items-center gap-3 transition-all transform hover:-translate-y-1 cursor-pointer"
          >
            <span>เข้าสู่เว็บแอป UP Match</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* จุดเด่น 3 ข้อ */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full text-left">
          <div className="p-5 rounded-3xl bg-white/60 border border-purple-50 shadow-sm backdrop-blur-md">
            <ShieldCheck className="w-7 h-7 text-purple-500 mb-3" />
            <h3 className="text-sm font-extrabold text-slate-800">ยืนยันตัวตนนิสิต 100%</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              เข้าใช้งานด้วย OTP ผ่านอีเมล @up.ac.th ปลอดภัย ไม่มีแอคหลุมจากคนนอกมอ
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white/60 border border-purple-50 shadow-sm backdrop-blur-md">
            <Users className="w-7 h-7 text-purple-500 mb-3" />
            <h3 className="text-sm font-extrabold text-slate-800">เลือกฟิลเตอร์ตามคณะได้</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              อยากทำความรู้จักเพื่อนต่างคณะ หรือหาสายรหัส/เพื่อนคณะเดียวกันก็เลือกปัดได้ทันที
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white/60 border border-purple-50 shadow-sm backdrop-blur-md">
            <MessageCircleHeart className="w-7 h-7 text-purple-500 mb-3" />
            <h3 className="text-sm font-extrabold text-slate-800">ใจตรงกัน เริ่มแชททันที</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              ปัดขวาคนที่ใช่ ถ้าใจตรงกันก็สามารถทักแชทไปชวนกินหมูกระทะหน้ามอ หรือชวนไปคาเฟ่ได้เลยทันที
            </p>
          </div>
        </div>
      </main>

      <footer className="py-5 text-center text-xs font-medium text-slate-400 relative z-10">
        UP Match • แพลตฟอร์มคอมมูนิตี้เพื่อชาว UP
      </footer>
    </div>
  );
}