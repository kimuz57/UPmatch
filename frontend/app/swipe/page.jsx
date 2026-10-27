// frontend/app/swipe/page.jsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  X,
  RotateCcw,
  GraduationCap,
  Loader2,
  MessageCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Dices,
  RefreshCw,
  Brain,
  Palette,
  Info,
  User,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";
import ProfileDetailModal from "@/components/ProfileDetailModal";

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
  const BATCH_LIMIT = 10;
  const PREFETCH_THRESHOLD = 3;

  const [profiles, setProfiles] = useState([]);
  const [swipedIds, setSwipedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const [matchData, setMatchData] = useState(null); 
  const [showProfileModal, setShowProfileModal] = useState(false);

  const getCookie = (name) => {
    if (typeof document === "undefined") return ""; 
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  };

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

  const loadMoreProfiles = async () => {
    if (isFetchingMoreRef.current || !hasMoreRef.current) return;
    isFetchingMoreRef.current = true;

    try {
      const token = getCookie("up_match_token");
      const email = getCookie("upmatch_email");
      const baseUrl = getApiBaseUrl();

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
          hasMoreRef.current = false;
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

  useEffect(() => {
    fetchProfiles();
  }, []);

  const [photoIndex, setPhotoIndex] = useState(0);
  const isDraggingRef = useRef(false);

  const deck = profiles.filter((p) => !swipedIds.includes(p.id));
  const currentCard = deck[0] || null;
  const currentAge = getProfileAge(currentCard);

  useEffect(() => {
    if (!loading && deck.length < PREFETCH_THRESHOLD && hasMoreRef.current && !isFetchingMoreRef.current) {
      loadMoreProfiles();
    }
  }, [deck.length, loading]);

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

  useEffect(() => {
    setPhotoIndex(0);
  }, [currentCard?.id]);

  const activeImageUrl = cardImages[photoIndex] || currentCard?.image || "/placeholder.jpg";

  const handlePrevPhoto = () => {
    if (cardImages.length <= 1) return;
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : cardImages.length - 1));
  };

  const handleNextPhoto = () => {
    if (cardImages.length <= 1) return;
    setPhotoIndex((prev) => (prev < cardImages.length - 1 ? prev + 1 : 0));
  };

  const handleSwipe = async (card, direction) => {
    if (!card) return;
    setSwipedIds((prev) => [...prev, card.id]);
    
    const email = getCookie("upmatch_email");
    setProfiles((prev) => {
      const updated = prev.filter((p) => p.id !== card.id);
      if (typeof window !== "undefined") {
        const currentCacheKey = email ? `upmatch_feed_cache_${email}` : "upmatch_feed_cache";
        sessionStorage.setItem(currentCacheKey, JSON.stringify(updated));
        sessionStorage.setItem("upmatch_feed_cache", JSON.stringify(updated));

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

  if (loading) {
    return (
      <div className="h-screen bg-transparent flex flex-col items-center justify-center relative z-10">
        <Heart className="w-10 h-10 text-purple-800 animate-pulse fill-purple-800 mb-3" />
        <p className="text-slate-700 font-semibold text-xs tracking-wide flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-800" /> กำลังค้นหาเพื่อนชาว ม.พะเยา...
        </p>
      </div>
    );
  }

  return (
    <div className="h-dvh max-h-screen bg-transparent text-slate-800 flex flex-col overflow-hidden relative z-10 page-bottom-padding">
      <div className="relative z-10 w-full shrink-0"><Navbar /></div>

      <main className="flex-1 min-h-0 max-w-4xl mx-auto w-full px-3 sm:px-4 py-1 sm:py-2 flex flex-col relative z-10 justify-center overflow-hidden">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-center justify-items-center flex-1 my-auto w-full">
          
          {/* Card Swipe Column: Left (Col 7) */}
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
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    className="w-full h-full rounded-2xl overflow-hidden shadow-md relative flex flex-col justify-end cursor-grab active:cursor-grabbing border border-slate-200 bg-slate-900 group select-none"
                  >
                    {/* Profile Image */}
                    <div className="absolute inset-0">
                      <img
                        key={activeImageUrl}
                        src={formatImageUrl(activeImageUrl)}
                        alt={currentCard.name}
                        className="w-full h-full object-cover transition-opacity duration-200 select-none pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent pointer-events-none" />
                    </div>

                    {/* Left/Right Tap Zones for photo flip */}
                    {cardImages.length > 1 && (
                      <div className="absolute inset-0 z-10 flex select-none">
                        <div
                          className="w-1/2 h-full cursor-pointer flex items-center justify-start pl-2.5 active:bg-black/5"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDraggingRef.current) return;
                            handlePrevPhoto();
                          }}
                          title="แตะซีกซ้ายเพื่อดูรูปก่อนหน้า"
                        >
                          <div className="w-7 h-7 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-80 transition flex items-center justify-center pointer-events-none">
                            <ChevronLeft className="w-4 h-4" />
                          </div>
                        </div>

                        <div
                          className="w-1/2 h-full cursor-pointer flex items-center justify-end pr-2.5 active:bg-black/5"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDraggingRef.current) return;
                            handleNextPhoto();
                          }}
                          title="แตะซีกขวาเพื่อดูรูปถัดไป"
                        >
                          <div className="w-7 h-7 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-80 transition flex items-center justify-center pointer-events-none">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Profile Info Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfileModal(true);
                      }}
                      title="ดูโปรไฟล์เต็ม"
                      className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    {/* Card Text Info */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProfileModal(true);
                      }}
                      className="relative z-20 p-4 sm:p-5 pb-6 text-white space-y-1 cursor-pointer hover:opacity-95 transition group"
                      title="แตะเพื่อดูโปรไฟล์เต็ม"
                    >
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black drop-shadow-sm">
                          {currentCard.name}{currentAge ? `, ${currentAge}` : ""}
                        </h2>
                        <span className="text-[10px] bg-white text-purple-950 font-bold px-2 py-0.5 rounded-full shadow-xs">
                          ดูโปรไฟล์
                        </span>
                      </div>
                      {currentCard.faculty && currentCard.faculty.trim() !== "-" && (
                        <p className="text-xs text-purple-200 font-semibold flex items-center gap-1 drop-shadow-xs">
                          <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>{currentCard.faculty}</span>
                        </p>
                      )}
                      {(currentCard.bio || currentCard.caption) && (
                        <p className="text-xs text-slate-200 leading-snug line-clamp-2 pt-0.5 font-normal">
                          {currentCard.bio || currentCard.caption}
                        </p>
                      )}
                    </div>

                    {/* Photo Dots Indicator */}
                    {cardImages.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 pointer-events-none shadow-xs">
                        {cardImages.map((_, idx) => (
                          <span
                            key={idx}
                            className={`transition-all duration-200 rounded-full ${
                              idx === photoIndex
                                ? "w-3.5 h-1.5 bg-white"
                                : "w-1.5 h-1.5 bg-white/40"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="w-full h-full rounded-2xl bg-white border border-slate-200 p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
                    <Users className="w-8 h-8 text-purple-800" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">ดูโปรไฟล์ครบทุกคนแล้ว</p>
                      <p className="text-xs text-slate-500 mt-1">สามารถกดสุ่มใหม่เพื่อโหลดเพื่อนนิสิตเพิ่มเติม</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchProfiles(true)}
                      className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 transition active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                      สุ่มคิวเพื่อนใหม่
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Tactile Control Buttons */}
            <div className="mt-4 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleRewind}
                title="ย้อนกลับการปัด"
                disabled={swipedIds.length === 0}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-amber-700 flex items-center justify-center shadow-xs disabled:opacity-40 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => fetchProfiles(true)}
                title="สุ่มคิวเพื่อนใหม่ทั้งหมด"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-purple-900 flex items-center justify-center shadow-xs transition active:scale-90 cursor-pointer"
              >
                <Dices className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>

              <button
                type="button"
                disabled={!currentCard}
                onClick={() => handleSwipe(currentCard, "left")}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shadow-sm disabled:opacity-40 transition cursor-pointer"
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
              </button>

              <button
                type="button"
                disabled={!currentCard}
                onClick={() => handleSwipe(currentCard, "right")}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md disabled:opacity-40 transition active:scale-95 cursor-pointer"
              >
                <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
              </button>
            </div>
          </div>

          {/* Desktop Preview Sidebar (Col 5) */}
          <div className="lg:col-span-5 w-full max-w-sm self-start pt-2 hidden lg:block">
            {currentCard && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-purple-800" />
                    <span>ข้อมูลทำความรู้จัก</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    className="text-[11px] font-bold text-purple-800 hover:underline cursor-pointer transition"
                  >
                    ดูโปรไฟล์เต็ม
                  </button>
                </div>

                {/* Caption */}
                {(currentCard.caption || currentCard.bio) && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-purple-800 mb-0.5">แนะนำตัว</p>
                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                      "{currentCard.caption || currentCard.bio}"
                    </p>
                  </div>
                )}

                {/* Faculty */}
                {currentCard.faculty && currentCard.faculty.trim() !== "-" && currentCard.faculty.trim() !== "" && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-purple-100 text-purple-900">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-500">คณะที่ศึกษา</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{currentCard.faculty}</p>
                    </div>
                  </div>
                )}

                {/* MBTI */}
                {currentCard.mbti && currentCard.mbti.trim() !== "-" && currentCard.mbti.trim() !== "" && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-purple-100 text-purple-900">
                        <Brain className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-800">บุคลิกภาพ (MBTI)</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs">
                      {currentCard.mbti}
                    </span>
                  </div>
                )}

                {/* Hobbies */}
                {currentCard.hobbies && currentCard.hobbies.trim() !== "-" && currentCard.hobbies.trim() !== "" && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                        <Palette className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-800">งานอดิเรก</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentCard.hobbies.split(/[,，、]+/).map((h, i) => (
                        <span key={i} className="text-[11px] bg-white border border-slate-200 text-slate-800 px-2.5 py-0.5 rounded-md font-medium">
                          {h.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="w-full py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <User className="w-3.5 h-3.5" />
                  แตะเพื่อดูรูปภาพและโปรไฟล์เต็ม
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* POPUP: IT'S A MATCH! */}
      <AnimatePresence>
        {matchData && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 flex flex-col items-center justify-center p-4"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              ใจตรงกันแล้ว!
            </h2>
            
            <p className="text-slate-200 mb-8 font-medium text-sm text-center">
              คุณและ {matchData.name} กดถูกใจตรงกัน สามารถเริ่มคุยกันได้ทันที
            </p>

            <div className="flex items-center justify-center mb-10">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white overflow-hidden shadow-xl z-10 translate-x-3">
                <img src="/logo.png" alt="My Profile" className="w-full h-full object-cover bg-purple-950" />
              </div>
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white overflow-hidden shadow-xl z-20 -translate-x-3">
                <img src={formatImageUrl(matchData.image)} alt={matchData.name} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="space-y-3 w-full max-w-xs">
              <button 
                onClick={() => router.push(`/chat`)}
                className="w-full py-3.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" /> ส่งข้อความทักทาย
              </button>
              <button 
                onClick={() => setMatchData(null)}
                className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition cursor-pointer"
              >
                ปัดหาเพื่อนต่อ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Profile Full View */}
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