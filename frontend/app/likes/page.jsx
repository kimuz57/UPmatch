// frontend/app/likes/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Sparkles, Users, PlaySquare, Loader2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";

export default function LikesPage() {
  const [whoLikesMe, setWhoLikesMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);

  useEffect(() => {
    const fetchWhoLikesMe = async () => {
      try {
        const getCookie = (name) => {
          if (typeof document === "undefined") return ""; 
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(";").shift();
          return "";
        };
        const token = getCookie("up_match_token");
        const email = getCookie("upmatch_email");
        const baseUrl = getApiBaseUrl();
        const url = email
          ? `${baseUrl}/api/v1/who-likes-me?email=${encodeURIComponent(email)}`
          : `${baseUrl}/api/v1/who-likes-me`;

        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-User-Email": email || "",
          },
        });

        if (res.ok) {
          const data = await res.json();
          setWhoLikesMe(data.likers || []);
        }
      } catch (error) {
        console.error("Failed to fetch likes:", error);
      } finally {
        setLoading(false);
      }
    };

    setIsUnlocked(localStorage.getItem("upmatch_likes_unlocked") === "true");
    fetchWhoLikesMe();
  }, []);

  const watchAdToUnlock = () => {
    setAdPlaying(true);
    setTimeout(() => {
      setAdPlaying(false);
      setIsUnlocked(true);
      localStorage.setItem("upmatch_likes_unlocked", "true");
      alert("ปลดล็อกเรียบร้อย! คุณสามารถดูและกดแมตช์คนที่มาไลก์คุณได้ 5 คน 🎉");
    }, 5000);
  };

  return (
    <div className="h-dvh max-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 text-slate-800 flex flex-col overflow-hidden">
      <div className="shrink-0 z-30">
        <Navbar />
      </div>
      <main className="flex-1 min-h-0 overflow-y-auto max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-3 sm:py-6 page-bottom-padding">
        
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center justify-center p-2.5 sm:p-3 bg-pink-100 rounded-full mb-2 sm:mb-3 shadow-xs border border-pink-200">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">คนที่แอบชอบคุณ</h1>
          <p className="text-xs sm:text-sm font-bold text-pink-500 mt-1">
            มีคนส่งใจให้คุณทั้งหมด {whoLikesMe.length} คน
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-pink-400 mb-2" />
            <p className="text-sm text-pink-500 font-bold">กำลังโหลดข้อมูลคนแอบชอบ...</p>
          </div>
        ) : whoLikesMe.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <Heart className="w-8 h-8 text-purple-300" />
            </div>
            <p className="text-slate-500 font-medium text-sm">ยังไม่มีคนแอบชอบคุณตอนนี้<br/>ลองไปปัดเพื่อนๆ เพิ่มดูสิ!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {whoLikesMe.map((liker, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: idx * 0.1 }}
                key={idx} 
                className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md border border-purple-100 bg-white"
              >
                <img 
                  src={formatImageUrl(liker.image)} 
                  alt="Liker" 
                  className={`w-full h-full object-cover transition duration-300 ${!isUnlocked ? 'blur-2xl scale-110' : ''}`}
                />
                
                {/* ถ้ายังไม่ปลดล็อก ให้แสดงแม่กุญแจทับรูป */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-pink-500/20 mix-blend-overlay">
                    <Heart className="w-10 h-10 text-white opacity-80" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-bold text-sm truncate w-full drop-shadow-md">
                    {isUnlocked ? liker.name : "ความลับ 🤫"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ================= กรอบโฆษณา/ปลดล็อก (ถ้ายังไม่ปลดล็อก และมีคนไลก์) ================= */}
        {!isUnlocked && whoLikesMe.length > 0 && (
          <div className="mt-8 p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-pink-200 shadow-xl max-w-lg mx-auto text-center">
            <h3 className="text-lg font-black text-slate-800 mb-2">ปลดล็อกเพื่อดูว่าใครชอบคุณ 👀</h3>
            <p className="text-sm text-slate-500 mb-6">คุณจะได้รับสิทธิ์กดไลก์กลับและแมตช์ได้ทันทีสูงสุด 5 คน</p>
            
            {adPlaying ? (
              <div className="w-full py-4 rounded-2xl bg-slate-800 flex flex-col items-center justify-center text-white space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                <span className="text-sm font-bold">กำลังเล่นวิดีโอโฆษณา... (5 วินาที)</span>
              </div>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => alert("ระบบแชร์ลิงก์ให้เพื่อน (เตรียมพร้อมพัฒนา)")}
                  className="w-full py-4 rounded-2xl bg-purple-100 text-purple-700 font-bold text-sm shadow-sm flex items-center justify-center gap-2 hover:bg-purple-200 transition cursor-pointer"
                >
                  <Users className="w-5 h-5" /> ชวนเพื่อน 3 คน (ใช้งานฟรีถาวร)
                </button>
                <button 
                  onClick={watchAdToUnlock}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-sm shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlaySquare className="w-5 h-5" /> ดูโฆษณาสั้นๆ ปลดล็อกทันที
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}