// frontend/app/likes/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Users, PlaySquare, Loader2, Heart, Eye } from "lucide-react";
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
      alert("ปลดล็อกเรียบร้อย คุณสามารถดูและกดแมตช์คนที่มาไลก์คุณได้ 5 คน");
    }, 5000);
  };

  return (
    <div className="h-dvh max-h-screen bg-transparent text-slate-800 flex flex-col overflow-hidden relative z-10">
      <div className="shrink-0 z-30">
        <Navbar />
      </div>
      <main className="flex-1 min-h-0 overflow-y-auto max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 page-bottom-padding">
        
        {/* Clean Editorial Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">คนที่แอบชอบคุณ</h1>
              <p className="text-xs text-slate-500 font-medium">
                มีนิสิตส่งใจให้คุณทั้งหมด {whoLikesMe.length} คน
              </p>
            </div>
          </div>
          {whoLikesMe.length > 0 && !isUnlocked && (
            <span className="self-start sm:self-auto text-xs px-2.5 py-1 rounded-md bg-purple-50 text-purple-900 font-semibold border border-purple-200">
              สถานะ: ซ่อนรูปภาพ
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-800 mb-2" />
            <p className="text-xs text-slate-600 font-semibold">กำลังโหลดข้อมูลคนแอบชอบ...</p>
          </div>
        ) : whoLikesMe.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-3 text-purple-800">
              <Heart className="w-7 h-7" />
            </div>
            <p className="text-slate-600 font-medium text-sm">ยังไม่มีคนแอบชอบคุณในขณะนี้<br/>ลองไปปัดเพื่อนๆ เพิ่มดูสิ</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {whoLikesMe.map((liker, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: idx * 0.05 }}
                key={idx} 
                className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white"
              >
                <img 
                  src={formatImageUrl(liker.image)} 
                  alt="Liker" 
                  className={`w-full h-full object-cover transition duration-300 ${!isUnlocked ? 'blur-2xl scale-110' : ''}`}
                />
                
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
                    <Heart className="w-8 h-8 text-white opacity-80" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-slate-950/80 to-transparent">
                  <p className="text-white font-bold text-xs truncate w-full drop-shadow-xs">
                    {isUnlocked ? liker.name : "ซ่อนโปรไฟล์"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Ad Unlock Banner */}
        {!isUnlocked && whoLikesMe.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto text-center space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900">ปลดล็อกเพื่อดูว่าใครแอบชอบคุณ</h2>
              <p className="text-xs text-slate-600 mt-1">คุณจะได้รับสิทธิ์กดไลก์กลับและแมตช์ได้ทันทีสูงสุด 5 คน</p>
            </div>
            
            {adPlaying ? (
              <div className="w-full py-4 rounded-xl bg-slate-900 flex flex-col items-center justify-center text-white space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
                <span className="text-xs font-semibold">กำลังเล่นวิดีโอโฆษณา... (5 วินาที)</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button 
                  onClick={() => alert("ระบบแชร์ลิงก์ให้เพื่อนกำลังพัฒนา")}
                  className="w-full py-3 rounded-xl bg-purple-50 text-purple-900 font-bold text-xs border border-purple-200 hover:bg-purple-100 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" /> ชวนเพื่อน 3 คน (ใช้งานฟรี)
                </button>
                <button 
                  onClick={watchAdToUnlock}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlaySquare className="w-4 h-4" /> ดูโฆษณาสั้นๆ เพื่อปลดล็อก
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}