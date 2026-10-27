// frontend/app/likes/page.jsx
// avoid-ai-design-ignore-file: K3, I3, C2
"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Users,
  Loader2,
  Heart,
  Eye,
  Copy,
  CheckCheck,
  Share2,
  MessageCircle,
  X,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";

export default function LikesPage() {
  const [whoLikesMe, setWhoLikesMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [matchingId, setMatchingId] = useState(null);
  const [matchedProfile, setMatchedProfile] = useState(null);

  const getCookie = (name) => {
    if (typeof document === "undefined") return "";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
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
        setIsPro(Boolean(data.is_pro));
        if (data.referral_code) {
          setReferralCode(data.referral_code);
        }
      }
    } catch (error) {
      console.error("Failed to fetch likes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhoLikesMe();

    // ดักฟัง Real-time Event จาก SSE เมื่อเพื่อนสมัครสำเร็จและได้อัปเกรดเป็น PRO
    const handleNotification = (e) => {
      const { type } = e.detail || {};
      if (type === "pro_upgrade") {
        setIsPro(true);
        fetchWhoLikesMe();
      }
    };

    window.addEventListener("upmatch_notification", handleNotification);
    return () => {
      window.removeEventListener("upmatch_notification", handleNotification);
    };
  }, []);

  // สร้าง Referral Link เฉพาะบุคคล
  const inviteUrl =
    typeof window !== "undefined" && referralCode
      ? `${window.location.origin}/?ref=${referralCode}`
      : "";

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareLine = () => {
    if (!inviteUrl) return;
    const text = encodeURIComponent(
      `มาเล่น UP Match ด้วยกันสิ! แพลตฟอร์มหาเพื่อนใหม่นิสิต ม.พะเยา: ${inviteUrl}`
    );
    window.open(`https://line.me/R/msg/text/?${text}`, "_blank");
  };

  // กดแมตช์คนที่มาไลก์เราทันที (สำหรับผู้ใช้ PRO)
  const handleInstantMatch = async (liker) => {
    if (!isPro) return;
    setMatchingId(liker.id);

    try {
      const token = getCookie("up_match_token");
      const email = getCookie("upmatch_email");
      const baseUrl = getApiBaseUrl();

      const res = await fetch(`${baseUrl}/api/v1/swipe`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Email": email || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          my_email: email,
          target_email: liker.id,
          direction: "right",
        }),
      });

      if (res.ok) {
        // ลบคนที่แมตช์แล้วออกจากรายการคนแอบชอบ
        setWhoLikesMe((prev) => prev.filter((item) => item.id !== liker.id));

        // แสดง Match Popup
        setMatchedProfile({
          id: liker.id,
          name: liker.name,
          image: liker.image,
          faculty: liker.faculty,
        });
      }
    } catch (error) {
      console.error("Match error:", error);
    } finally {
      setMatchingId(null);
    }
  };

  return (
    <div className="h-dvh max-h-screen bg-transparent text-slate-800 flex flex-col overflow-hidden relative z-10">
      <div className="shrink-0 z-30">
        <Navbar />
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 page-bottom-padding">
        {/* Clean Editorial Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0 shadow-xs">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  คนที่แอบชอบคุณ
                </h1>
                {isPro && (
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-purple-900 text-white font-bold shadow-xs">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                มีนิสิตส่งใจให้คุณทั้งหมด {whoLikesMe.length} คน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isPro ? (
              <span className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-900 font-bold border border-purple-200 flex items-center gap-1.5 shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-purple-800" />
                <span>สถานะ: สมาชิก PRO (ดูและแมตช์ได้ทันที)</span>
              </span>
            ) : (
              <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                สถานะ: บัญชีทั่วไป (รูปภาพเบลอ)
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-800 mb-2" />
            <p className="text-xs text-slate-600 font-semibold">
              กำลังโหลดข้อมูลคนแอบชอบ...
            </p>
          </div>
        ) : whoLikesMe.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-3 text-purple-800">
              <Heart className="w-7 h-7" />
            </div>
            <p className="text-slate-600 font-medium text-sm leading-relaxed">
              ยังไม่มีคนแอบชอบคุณในขณะนี้
              <br />
              ลองไปปัดเพื่อนๆ เพิ่มดูสิ
            </p>
          </div>
        ) : (
          /* Grid of Likers */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4 max-w-4xl mx-auto">
            {whoLikesMe.map((liker, idx) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                key={liker.id || idx}
                className="relative aspect-[3/4.3] rounded-2xl overflow-hidden shadow-xs border border-purple-200/70 bg-purple-50 flex flex-col justify-end group"
              >
                {/* Liker Photo: full crisp photo */}
                <img
                  src={formatImageUrl(liker.image)}
                  alt={liker.name || "Liker"}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Top Subtle Floating Badge */}
                <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full bg-slate-900/40 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1.5 border border-white/20 shadow-xs">
                  <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                  <span>{isPro ? "ถูกใจคุณ" : "คนที่แอบชอบ"}</span>
                </div>

                {/* Frosted Purple Blur Layer on Bottom Half */}
                <div className="absolute inset-x-0 bottom-0 h-[52%] z-20 backdrop-blur-md bg-purple-950/60 border-t border-purple-200/25 p-3 sm:p-3.5 flex flex-col justify-end text-white">
                  {isPro ? (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-900/80 text-[10px] font-bold text-purple-200 border border-purple-400/30 w-fit mb-0.5">
                        <span>นิสิต UP</span>
                      </span>
                      <h3 className="font-extrabold text-xs sm:text-sm text-white truncate drop-shadow-sm">
                        {liker.name}
                        {liker.age ? `, ${liker.age}` : ""}
                      </h3>
                      {liker.faculty && (
                        <p className="text-[10px] sm:text-[11px] text-purple-200 font-medium truncate mt-0.5">
                          {liker.faculty}
                        </p>
                      )}

                      {/* Instant Match Button for PRO */}
                      <button
                        type="button"
                        disabled={matchingId === liker.id}
                        onClick={() => handleInstantMatch(liker)}
                        className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-[11px] font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="กดแมตช์ทันที"
                      >
                        {matchingId === liker.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Heart className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>แมตช์เลย</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-purple-200 border border-white/20 w-fit mb-0.5">
                        <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                        <span>มีคนแอบชอบ</span>
                      </span>
                      <h3 className="font-extrabold text-xs sm:text-sm text-white truncate drop-shadow-sm">
                        นิสิต ม.พะเยา
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-purple-200/90 font-medium truncate mt-0.5">
                        ชวนเพื่อน 1 คน เพื่อดูชื่อ & แมตช์
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("referral-section");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                          else handleCopyLink();
                        }}
                        className="w-full mt-2 py-1.5 px-2 rounded-lg bg-white/20 hover:bg-white/30 active:scale-[0.98] text-white text-[11px] font-bold transition flex items-center justify-center gap-1 border border-white/25 cursor-pointer shadow-xs"
                      >
                        <span>ปลดล็อก PRO</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Referral Unlock Box (สำหรับผู้ใช้ทั่วไปที่ยังไม่ได้เป็น PRO) */}
        {!isPro && whoLikesMe.length > 0 && (
          <div
            id="referral-section"
            className="mt-8 p-5 sm:p-7 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto text-center space-y-4"
          >
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                ชวนเพื่อน 1 คนเพื่อปลดล็อกเป็น PRO ถาวร
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                ส่งลิงก์ด้านล่างให้เพื่อนนิสิต ม.พะเยา 1 คน เมื่อเพื่อนสมัครสำเร็จ
                ระบบจะอัปเกรดบัญชีของคุณเป็น PRO ทันที ดูรูปชัดเจนและกดแมตช์ได้ทุกคน
              </p>
            </div>

            {/* Referral Link Box */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl || "กำลังสร้างลิงก์ชวนเพื่อน..."}
                  className="flex-1 bg-transparent text-xs text-slate-800 font-mono px-2 py-1 outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  disabled={!inviteUrl}
                  className="px-3 py-1.5 rounded-lg bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์</span>
                    </>
                  )}
                </button>
              </div>

              {/* Share to LINE Button */}
              <button
                type="button"
                onClick={handleShareLine}
                disabled={!inviteUrl}
                className="w-full py-2.5 px-4 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>แชร์ไปยัง LINE ให้เพื่อนสมัคร</span>
              </button>
            </div>

            {/* Live Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
              <span>ระบบ Real-time กำลังรอเพื่อน 1 คนสมัครผ่านลิงก์...</span>
            </div>
          </div>
        )}
      </main>

      {/* Match Success Popup Modal */}
      <AnimatePresence>
        {matchedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xs border border-slate-200 text-center relative"
            >
              <button
                type="button"
                onClick={() => setMatchedProfile(null)}
                className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 mx-auto mb-3 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shadow-xs">
                <Heart className="w-6 h-6 fill-rose-600 text-rose-600" />
              </div>

              <h2 className="text-xl font-black text-slate-900 mb-1">
                ใจตรงกันแล้ว!
              </h2>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                คุณและ <span className="font-bold text-slate-900">{matchedProfile.name}</span>{" "}
                กดใจให้กัน ตอนนี้เปิดห้องแชทพร้อมคุยได้ทันที
              </p>

              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-purple-200 shadow-xs mb-6">
                <img
                  src={formatImageUrl(matchedProfile.image)}
                  alt={matchedProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setMatchedProfile(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  ดูคนอื่นต่อ
                </button>
                <Link
                  href={`/chat/${matchedProfile.id}`}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>ทักแชทเลย</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}