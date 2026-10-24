// frontend/app/swipe/page.jsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, RotateCcw, GraduationCap, MapPin, Music, Sparkles, Loader2, MessageCircle, PlaySquare, Users, ChevronLeft, ChevronRight, Dices, RefreshCw, Brain, Palette, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";
import ProfileDetailModal from "@/components/ProfileDetailModal";

const floatingHearts = [
  { id: 1, left: "10%", size: 24, delay: 0, duration: 14 },
  { id: 2, left: "25%", size: 16, delay: 2, duration: 18 },
  { id: 3, left: "45%", size: 32, delay: 1, duration: 15 },
  { id: 4, left: "65%", size: 20, delay: 4, duration: 20 },
  { id: 5, left: "85%", size: 28, delay: 2.5, duration: 16 },
  { id: 6, left: "15%", size: 18, delay: 5, duration: 17 },
  { id: 7, left: "35%", size: 22, delay: 7, duration: 13 },
  { id: 8, left: "55%", size: 26, delay: 3.5, duration: 19 },
  { id: 9, left: "75%", size: 15, delay: 6, duration: 14 },
  { id: 10, left: "90%", size: 30, delay: 1.5, duration: 18 },
  { id: 11, left: "5%", size: 20, delay: 8, duration: 15 },
  { id: 12, left: "50%", size: 14, delay: 0.5, duration: 12 },
];


const getProfileAge = (card) => {
  if (card?.age && card.age > 0) return card.age;
  const rawDate = card?.birth_date || card?.birthDate || card?.BirthDate;
  if (!rawDate) return null;
  const birth = new Date(rawDate);
  if (isNaN(birth.getTime()) || birth.getFullYear() <= 1900) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
};

export default function SwipePage() {
  const router = useRouter();
  const CACHE_KEY = "upmatch_feed_cache";
  const BATCH_LIMIT = 10;
  const PREFETCH_THRESHOLD = 3;

  const [profiles, setProfiles] = useState([]);
  const [swipedIds, setSwipedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const [matchData, setMatchData] = useState(null); 
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [whoLikesMe, setWhoLikesMe] = useState([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ✅ แก้ไข: ดัก typeof document เพื่อป้องกัน Error จากฝั่ง Server (Next.js SSR)
  const getCookie = (name) => {
    if (typeof document === "undefined") return ""; 
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  };

  // ดึงฟีดเริ่มต้น (ดึงจาก Cache ก่อน หรือโหลด 10 คนแรก) / ถ้า isFresh = true จะล้างแคชทิ้งแล้วสุ่มใหม่ทั้งหมด
  const fetchProfiles = async (isFresh = false) => {
    const email = getCookie("upmatch_email");
    const currentCacheKey = email ? `upmatch_feed_cache_${email}` : "upmatch_feed_cache";

    if (isFresh) {
      setIsRefreshing(true);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("upmatch_feed_cache");
        sessionStorage.removeItem(currentCacheKey);
        sessionStorage.removeItem(`upmatch_swiped_${email || "guest"}`);
      }
      setProfiles([]);
      setSwipedIds([]);
      setPhotoIndex(0);
      hasMoreRef.current = true;
    } else {
      // 1. ลองอ่านจาก Cache ก่อน เพื่อความรวดเร็วและคงผลลัพธ์เดิมไว้จนกว่าจะกดรีเฟรช
      if (typeof window !== "undefined") {
        try {
          const cached = sessionStorage.getItem(currentCacheKey) || sessionStorage.getItem("upmatch_feed_cache");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const swipedKey = `upmatch_swiped_${email || "guest"}`;
              const savedSwiped = JSON.parse(sessionStorage.getItem(swipedKey) || "[]");
              const remaining = parsed.filter((p) => !savedSwiped.includes(p.id));
              if (remaining.length > 0) {
                setProfiles(remaining);
                setLoading(false);
                return;
              }
            }
          }
        } catch (e) {
          console.warn("Failed to load feed cache", e);
        }
      }
    }

    setLoading(true);
    try {
      const token = getCookie("up_match_token");
      const baseUrl = getApiBaseUrl();
      const url = email
        ? `${baseUrl}/api/v1/feed?email=${encodeURIComponent(email)}&limit=${BATCH_LIMIT}`
        : `${baseUrl}/api/v1/feed?limit=${BATCH_LIMIT}`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Email": email || "",
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        const initialList = data.profiles || [];
        setProfiles(initialList);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(currentCacheKey, JSON.stringify(initialList));
        }
        if (initialList.length < BATCH_LIMIT) {
          hasMoreRef.current = false;
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // โหลดคนเพิ่มล่วงหน้าอัตโนมัติเมื่อเหลือในคิวน้อยกว่า 3 คน
  const loadMoreProfiles = async () => {
    if (isFetchingMoreRef.current || !hasMoreRef.current) return;
    isFetchingMoreRef.current = true;

    try {
      const token = getCookie("up_match_token");
      const email = getCookie("upmatch_email");
      const baseUrl = getApiBaseUrl();

      // รวบรวม ID ทั้งหมดที่มีในคิวแล้ว เพื่อส่งให้ Backend กรองออก ไม่ให้สุ่มซ้ำ
      const knownIds = profiles.map((p) => p.id);
      const excludeParam = knownIds.length > 0 ? `&exclude=${encodeURIComponent(knownIds.join(","))}` : "";

      const url = email
        ? `${baseUrl}/api/v1/feed?email=${encodeURIComponent(email)}&limit=${BATCH_LIMIT}${excludeParam}`
        : `${baseUrl}/api/v1/feed?limit=${BATCH_LIMIT}${excludeParam}`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Email": email || "",
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const incoming = data.profiles || [];

        if (incoming.length === 0) {
          hasMoreRef.current = false; // ไม่มีคนในระบบให้สุ่มต่อแล้ว
        } else {
          setProfiles((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const uniqueIncoming = incoming.filter((p) => !existingIds.has(p.id));
            const updated = [...prev, ...uniqueIncoming];
            if (typeof window !== "undefined") {
              const currentCacheKey = email ? `upmatch_feed_cache_${email}` : "upmatch_feed_cache";
              sessionStorage.setItem(currentCacheKey, JSON.stringify(updated));
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Auto pre-fetch more profiles error:", error);
    } finally {
      isFetchingMoreRef.current = false;
    }
  };

  const fetchWhoLikesMe = async () => {
    try {
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
    } catch (error) {}
  };

  useEffect(() => {
    setIsUnlocked(localStorage.getItem("upmatch_likes_unlocked") === "true");
    fetchProfiles();
    fetchWhoLikesMe();
  }, []);

  const [photoIndex, setPhotoIndex] = useState(0);
  const isDraggingRef = useRef(false);

  const deck = profiles.filter((p) => !swipedIds.includes(p.id));
  const currentCard = deck[0] || null;
  const currentAge = getProfileAge(currentCard);

  // ตรวจจับเมื่อเหลือคนที่ยังไม่ได้ปัดน้อยกว่า 3 คน -> โหลดเพิ่มอีก 10 คนล่วงหน้าทันที
  useEffect(() => {
    if (!loading && deck.length < PREFETCH_THRESHOLD && hasMoreRef.current && !isFetchingMoreRef.current) {
      loadMoreProfiles();
    }
  }, [deck.length, loading]);

  // ดึงรายการรูปภาพทั้งหมดของการ์ดปัจจุบัน
  const cardImages = useMemo(() => {
    if (!currentCard) return [];
    if (Array.isArray(currentCard.images) && currentCard.images.length > 0) {
      return currentCard.images;
    }
    if (currentCard.image) {
      return [currentCard.image];
    }
    return ["/placeholder.jpg"];
  }, [currentCard]);

  // รีเซ็ตรูปภาพกลับมาที่รูปแรก (ใบที่ 0) เมื่อเปลี่ยนการ์ดใบใหม่
  useEffect(() => {
    setPhotoIndex(0);
  }, [currentCard?.id]);

  const activeImageUrl = cardImages[photoIndex] || currentCard?.image || "/placeholder.jpg";

  // แตะซีกซ้าย: ดูรูปก่อนหน้า
  const handlePrevPhoto = () => {
    if (cardImages.length <= 1) return;
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : cardImages.length - 1));
  };

  // แตะซีกขวา: ดูรูปถัดไป
  const handleNextPhoto = () => {
    if (cardImages.length <= 1) return;
    setPhotoIndex((prev) => (prev < cardImages.length - 1 ? prev + 1 : 0));
  };

  const handleSwipe = async (card, direction) => {
    if (!card) return;
    setSwipedIds((prev) => [...prev, card.id]);
    
    // นำการ์ดที่ปัดแล้วออกจาก profiles ทันที และอัปเดตแคชใน sessionStorage
    const email = getCookie("upmatch_email");
    setProfiles((prev) => {
      const updated = prev.filter((p) => p.id !== card.id);
      if (typeof window !== "undefined") {
        const currentCacheKey = email ? `upmatch_feed_cache_${email}` : "upmatch_feed_cache";
        sessionStorage.setItem(currentCacheKey, JSON.stringify(updated));
        sessionStorage.setItem("upmatch_feed_cache", JSON.stringify(updated));

        // บันทึกประวัติคนที่ปัดแล้วใน session เพื่อป้องกันการวนกลับมาอีกเมื่อรีเฟรชหน้า
        try {
          const swipedKey = `upmatch_swiped_${email || "guest"}`;
          const currentSwiped = JSON.parse(sessionStorage.getItem(swipedKey) || "[]");
          if (!currentSwiped.includes(card.id)) {
            currentSwiped.push(card.id);
            sessionStorage.setItem(swipedKey, JSON.stringify(currentSwiped));
          }
        } catch (e) {}
      }
      return updated;
    });

    try {
      const token = getCookie("up_match_token");
      const res = await fetch(`${getApiBaseUrl()}/api/v1/swipe`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Email": email || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          my_email: email,
          target_email: card.id,
          direction: direction,
        }),
      });
      
      const data = await res.json();
      if (data.match) {
        setMatchData(data.matched_profile);
      }
    } catch (error) {
      console.error("Swipe API failed", error);
    }
  };

  const handleRewind = () => {
    if (swipedIds.length === 0) return;
    setPhotoIndex(0);
    setSwipedIds((prev) => prev.slice(0, prev.length - 1));
  };

  const watchAdToUnlock = () => {
    setAdPlaying(true);
    setTimeout(() => {
      setAdPlaying(false);
      setIsUnlocked(true);
      localStorage.setItem("upmatch_likes_unlocked", "true");
      alert("ปลดล็อกเรียบร้อย! คุณได้รับโควต้าดูคนที่มาไลก์คุณ 5 คน 🎉");
    }, 5000);
  };

  if (loading) {
    return (
      <div className="h-screen bg-transparent flex flex-col items-center justify-center">
        <Heart className="w-12 h-12 text-purple-400 animate-bounce fill-purple-400 mb-4" />
        <p className="text-purple-600 font-bold text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> กำลังค้นหาเพื่อนชาว มพ...
        </p>
      </div>
    );
  }

  return (
    <div className="h-dvh max-h-screen bg-transparent text-slate-800 flex flex-col overflow-hidden relative page-bottom-padding">
      <div className="relative z-10 w-full shrink-0"><Navbar /></div>

      <main className="flex-1 min-h-0 max-w-4xl mx-auto w-full px-3 sm:px-4 py-1 sm:py-2 flex flex-col relative z-10 justify-center overflow-hidden">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-center justify-items-center flex-1 my-auto w-full">
          
          {/* คอลัมน์การ์ดปัด: ซีกซ้าย (Col 7) */}
          <div className="lg:col-span-7 flex flex-col items-center w-full justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-xs aspect-[3/4] flex items-center justify-center">
              <AnimatePresence>
                {currentCard ? (
                  <motion.div
                    key={currentCard.id}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragStart={() => {
                      isDraggingRef.current = true;
                    }}
                    onDragEnd={(_, info) => {
                      setTimeout(() => {
                        isDraggingRef.current = false;
                      }, 150);
                      if (info.offset.x > 100) handleSwipe(currentCard, "right");
                      else if (info.offset.x < -100) handleSwipe(currentCard, "left");
                    }}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full h-full rounded-3xl overflow-hidden shadow-xl relative flex flex-col justify-end cursor-grab active:cursor-grabbing border border-purple-100/50 bg-white group select-none"
                  >
                    {/* ภาพโปรไฟล์ตามลำดับรูปภาพที่เลือก */}
                    <div className="absolute inset-0">
                      <img
                        key={activeImageUrl}
                        src={formatImageUrl(activeImageUrl)}
                        alt={currentCard.name}
                        className="w-full h-full object-cover transition-opacity duration-200 select-none pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                    </div>

                    {/* แท็บแบ่งซีกซ้าย-ขวา เพื่อแตะดูรูปภาพทั้งหมดของการ์ดนี้ */}
                    {cardImages.length > 1 && (
                      <div className="absolute inset-0 z-10 flex select-none">
                        {/* ซีกซ้าย: ดูรูปก่อนหน้า */}
                        <div
                          className="w-1/2 h-full cursor-pointer flex items-center justify-start pl-2.5 active:bg-black/5"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDraggingRef.current) return;
                            handlePrevPhoto();
                          }}
                          title="แตะซีกซ้ายเพื่อดูรูปก่อนหน้า"
                        >
                          <div className="w-7 h-7 rounded-full bg-black/25 text-white/80 opacity-0 group-hover:opacity-75 transition flex items-center justify-center backdrop-blur-xs pointer-events-none">
                            <ChevronLeft className="w-4 h-4" />
                          </div>
                        </div>

                        {/* ซีกขวา: ดูรูปถัดไป */}
                        <div
                          className="w-1/2 h-full cursor-pointer flex items-center justify-end pr-2.5 active:bg-black/5"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDraggingRef.current) return;
                            handleNextPhoto();
                          }}
                          title="แตะซีกขวาเพื่อดูรูปถัดไป"
                        >
                          <div className="w-7 h-7 rounded-full bg-black/25 text-white/80 opacity-0 group-hover:opacity-75 transition flex items-center justify-center backdrop-blur-xs pointer-events-none">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ปุ่มดูโปรไฟล์เต็มบนการ์ด */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfileModal(true);
                      }}
                      title="ดูโปรไฟล์เต็ม"
                      className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    {/* ข้อมูลโปรไฟล์บนการ์ด (คลิกเพื่อเปิดดูโปรไฟล์เต็ม) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfileModal(true);
                      }}
                      className="relative z-20 p-4 sm:p-5 pb-7 sm:pb-7 text-white space-y-1 sm:space-y-1.5 cursor-pointer hover:opacity-90 transition group"
                      title="แตะเพื่อดูรูปภาพและโปรไฟล์เต็ม"
                    >
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black drop-shadow-md">
                          {currentCard.name}{currentAge ? `, ${currentAge}` : ""}
                        </h2>
                        <span className="text-[10px] bg-white/30 backdrop-blur-xs text-white font-bold px-2 py-0.5 rounded-full shadow-xs opacity-90 group-hover:bg-white group-hover:text-purple-600 transition">
                          ดูโปรไฟล์ ➔
                        </span>
                      </div>
                      {currentCard.faculty && currentCard.faculty.trim() !== "-" && (
                        <p className="text-xs text-purple-200 font-bold flex items-center gap-1 drop-shadow-sm">
                          <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>{currentCard.faculty}</span>
                        </p>
                      )}
                      {(currentCard.bio || currentCard.caption) && (
                        <p className="text-xs text-slate-100 leading-snug line-clamp-2 pt-1 font-medium drop-shadow-md">
                          {currentCard.bio || currentCard.caption}
                        </p>
                      )}
                    </div>

                    {/* เม็ดไข่ปลา ด้านล่างตรงกลาง: แสดงจำนวนรูปทั้งหมด และรูปปัจจุบัน */}
                    {cardImages.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-xs pointer-events-none shadow-sm">
                        {cardImages.map((_, idx) => (
                          <span
                            key={idx}
                            className={`transition-all duration-300 rounded-full ${
                              idx === photoIndex
                                ? "w-4 h-1.5 bg-white shadow-xs"
                                : "w-1.5 h-1.5 bg-white/45"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="w-full h-full rounded-3xl bg-white/80 backdrop-blur-md border border-purple-100 p-6 flex flex-col items-center justify-center text-center space-y-2 shadow-md">
                    <Sparkles className="w-8 h-8 text-purple-500" />
                    <p className="text-sm font-bold text-slate-800">ดูโปรไฟล์ครบทุกคนแล้ว!</p>
                    <button
                      type="button"
                      onClick={() => fetchProfiles(true)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                      รีเฟรชคิวเพื่อนใหม่ (สุ่มใหม่ทั้งหมด)
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* ปุ่มควบคุม (ย้อนกลับ, สุ่มใหม่, ข้าม, ถูกใจ) */}
            <div className="mt-3 flex items-center gap-3 sm:gap-3.5 shrink-0">
              <button
                type="button"
                onClick={handleRewind}
                title="ย้อนกลับการปัด"
                disabled={swipedIds.length === 0}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-amber-50 border border-purple-100 text-amber-500 flex items-center justify-center shadow-lg disabled:opacity-40 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => fetchProfiles(true)}
                title="สุ่มคิวเพื่อนใหม่ทั้งหมด (ล้างแคช)"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-lg transition active:scale-90 cursor-pointer"
              >
                <Dices className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>

              <button
                type="button"
                disabled={!currentCard}
                onClick={() => handleSwipe(currentCard, "left")}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white hover:bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center shadow-lg disabled:opacity-40 transition cursor-pointer"
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
              </button>

              <button
                type="button"
                disabled={!currentCard}
                onClick={() => handleSwipe(currentCard, "right")}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 hover:opacity-90 text-white flex items-center justify-center shadow-xl shadow-purple-200 disabled:opacity-40 transition cursor-pointer"
              >
                <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
              </button>
            </div>
          </div>

          {/* มุมทำความรู้จัก (แสดงเฉพาะบน Desktop & iPad แนวนอน): ย้ายไปด้านบนสุด (self-start pt-2) */}
          <div className="lg:col-span-5 w-full max-w-sm self-start pt-2 sm:pt-4 hidden lg:block">
            {currentCard && (
              <div className="bg-white/90 backdrop-blur-md border border-purple-100 rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-purple-600 flex items-center gap-1.5">
                    <span>💬</span> มุมทำความรู้จัก
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    className="text-[11px] font-bold text-purple-600 hover:text-pink-600 hover:underline flex items-center gap-1 cursor-pointer transition"
                  >
                    ดูโปรไฟล์เต็ม ➔
                  </button>
                </div>

                {/* 1. แคปชั่น / แนะนำตัว (ถ้าไม่ได้ใส่ไม่ต้องแสดงเลย) */}
                {(currentCard.caption || currentCard.bio) && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/80 to-pink-50/50 border border-purple-100/80">
                    <p className="text-[10px] font-bold text-purple-600 mb-0.5">💬 แคปชั่น / แนะนำตัว</p>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">
                      "{currentCard.caption || currentCard.bio}"
                    </p>
                  </div>
                )}

                {/* 2. คณะ (ถ้าไม่ได้ใส่ไม่ต้องแสดงเลย) */}
                {currentCard.faculty && currentCard.faculty.trim() !== "-" && currentCard.faculty.trim() !== "" && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                    <span className="p-1.5 rounded-xl bg-purple-100 text-purple-600">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400">คณะที่ศึกษา</p>
                      <p className="text-xs font-bold text-slate-800 truncate">{currentCard.faculty}</p>
                    </div>
                  </div>
                )}

                {/* 3. MBTI (ถ้าไม่ได้ใส่ไม่ต้องแสดงเลย) */}
                {currentCard.mbti && currentCard.mbti.trim() !== "-" && currentCard.mbti.trim() !== "" && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-pink-100 text-pink-600">
                        <Brain className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-700">บุคลิกภาพ (MBTI)</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black text-xs shadow-xs">
                      {currentCard.mbti}
                    </span>
                  </div>
                )}

                {/* 4. งานอดิเรก (ถ้าไม่ได้ใส่ไม่ต้องแสดงเลย) */}
                {currentCard.hobbies && currentCard.hobbies.trim() !== "-" && currentCard.hobbies.trim() !== "" && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="p-1.5 rounded-xl bg-amber-100 text-amber-600">
                        <Palette className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-700">งานอดิเรก</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentCard.hobbies.split(/[,，、]+/).map((h, i) => (
                        <span key={i} className="text-[11px] bg-white border border-purple-200 text-purple-700 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
                          {h.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ถ้าไม่ได้ใส่ข้อมูลอะไรเลยสักอย่าง */}
                {!currentCard.caption && !currentCard.bio && (!currentCard.faculty || currentCard.faculty === "-") && (!currentCard.mbti || currentCard.mbti === "-") && (!currentCard.hobbies || currentCard.hobbies === "-") && (
                  <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-center">
                    <p className="text-xs text-purple-600 font-medium">เขายังไม่ได้เพิ่มข้อมูลแนะนำตัว ลองปัดถูกใจแล้วทักไปคุยดูนะ 😉</p>
                  </div>
                )}

                {/* ปุ่มแตะดูรูปภาพและโปรไฟล์เต็ม */}
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="w-full py-2.5 rounded-2xl bg-purple-100/70 hover:bg-purple-100 text-purple-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  แตะเพื่อดูรูปภาพและโปรไฟล์เต็ม
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ======================= POPUP: IT'S A MATCH! ======================= */}
      <AnimatePresence>
        {matchData && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            <motion.h2 
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }}
              className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-8 tracking-wide drop-shadow-2xl"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              It's a Match!
            </motion.h2>
            
            <p className="text-white mb-8 font-medium">คุณและ {matchData.name} ใจตรงกัน 💖</p>

            <div className="flex items-center justify-center gap-[-20px] mb-10">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl z-10 translate-x-4">
                <img src="/logo.png" alt="My Profile" className="w-full h-full object-cover bg-white" />
              </div>
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl z-20 -translate-x-4">
                <img src={formatImageUrl(matchData.image)} alt={matchData.name} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="space-y-4 w-full max-w-xs">
              <button 
                onClick={() => router.push(`/chat`)}
                className="w-full py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black text-sm shadow-lg shadow-pink-500/30 hover:scale-105 transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> ส่งข้อความทักทายเลย
              </button>
              <button 
                onClick={() => setMatchData(null)}
                className="w-full py-4 rounded-full bg-white/10 text-white font-bold text-sm border border-white/20 hover:bg-white/20 transition"
              >
                ปัดหาเพื่อนต่อ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal ดูโปรไฟล์เต็ม (โชว์รูปเรียงๆ + ข้อมูลละเอียด) */}
      <ProfileDetailModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentCard}
        onAction={(action) => handleSwipe(currentCard, action)}
        actionType="swipe"
      />
    </div>
  );
}