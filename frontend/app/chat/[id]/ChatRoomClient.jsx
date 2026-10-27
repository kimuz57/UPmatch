"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getSessionSignature } from "@/utils/session";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";
import ProfileDetailModal from "@/components/ProfileDetailModal";
import {
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  CheckCheck,
  Search,
  X,
  Smile,
  MoreVertical,
  UserX,
  Flag,
  ShieldAlert,
} from "lucide-react";

// ตรวจสอบว่าข้อความเป็น URL รูปภาพหรือ GIF หรือไม่
const isGifOrImageUrl = (text) => {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  return (
    /\.(gif|webp|png|jpe?g)(\?.*)?$/i.test(trimmed) ||
    /giphy\.com/i.test(trimmed) ||
    /tenor\.com/i.test(trimmed)
  );
};

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh";

const GIF_CATEGORIES = [
  { id: "trending", label: "🔥 ยอดฮิต", query: "" },
  { id: "hello", label: "👋 ทักทาย", query: "hello greeting wave" },
  { id: "love", label: "💖 เลิฟ", query: "love cute heart" },
  { id: "funny", label: "😂 ตลก", query: "funny meme lol" },
  { id: "party", label: "🥳 ฉลอง", query: "celebrate happy dance" },
  { id: "cute", label: "🥺 อ้อน", query: "cute shy" },
  { id: "cat", label: "🐱 น้องแมว", query: "cute cat kitten" },
  { id: "food", label: "🧋 ชวนกิน", query: "food yummy boba" },
];

// คอมโพเนนต์แสดงรูปโปรไฟล์ ป้องกันภาพเสียและ fallback เป็นตัวอักษรแรกอย่างสวยงาม
function UserAvatar({ src, name, size = "w-11 h-11" }) {
  const [hasError, setHasError] = useState(false);
  const initial = (name || "?").charAt(0).toUpperCase();

  if (!src || hasError) {
    return (
      <div
        className={`${size} rounded-full bg-gradient-to-tr from-purple-500 to-pink-400 text-white font-extrabold flex items-center justify-center text-sm shadow-sm border-2 border-white shrink-0`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={formatImageUrl(src)}
      alt={name || "User"}
      onError={() => setHasError(true)}
      className={`${size} rounded-full object-cover border-2 border-purple-200 shadow-sm shrink-0`}
    />
  );
}

export default function ChatRoomClient({ targetEmail }) {
  const [myEmail, setMyEmail] = useState("");
  const [targetUser, setTargetUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // สเตตสำหรับ Infinite GIF Search API
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifCategory, setGifCategory] = useState("trending");
  const [gifSearch, setGifSearch] = useState("");
  const [apiGifs, setApiGifs] = useState([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  // สเตตสำหรับจุดไข่ปลา (Header Menu), อันแมตช์ และ รายงาน
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("พฤติกรรมไม่เหมาะสม / ก่อกวน");
  const [reportDetails, setReportDetails] = useState("");
  const [reportAlsoUnmatch, setReportAlsoUnmatch] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);

  const getCookie = (name) => {
    if (typeof document === "undefined") return "";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
    return "";
  };

  const scrollToBottom = (behavior = "smooth") => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: behavior });
    }
  };

  // 🔐 ตรวจสอบสิทธิ์การเข้าห้องแชท และจัดการ token บน URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const email = getCookie("upmatch_email");
    const token = getCookie("up_match_token");

    // ถ้าไม่มี Token หรือไม่ได้ล็อกอิน ให้เด้งกลับหน้าแรกทันที
    if (!token && !email) {
      window.location.replace("/?unauthorized=1");
      return;
    }

    const mySig = getSessionSignature(token || email);
    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get("token") || searchParams.get("sid");

    // กรณีมี token บน URL (เช่น ก็อปลิงก์จากคนอื่นมาเปิด) แต่ token ไม่ตรงกับของผู้ใช้ปัจจุบัน
    // ให้เด้งกลับหน้าแรกทันที ป้องกันเพื่อนเปิดดูแชทของคนอื่น
    if (urlToken && urlToken !== mySig && urlToken !== token && urlToken !== email) {
      window.location.replace("/?unauthorized=1");
      return;
    }

    // ถ้าบน URL ยังไม่มี token ให้ใส่ token ของเราลงไปทันที เพื่อให้เวลาก็อปส่งจะมี token ติดไปด้วยเสมอ
    if (!urlToken && mySig) {
      searchParams.set("token", mySig);
      const newQuery = searchParams.toString() ? `?${searchParams.toString()}` : "";
      window.history.replaceState(null, "", `${window.location.pathname}${newQuery}`);
    }
  }, []);

  const fetchMessages = async (showLoading = false) => {
    if (!targetEmail) return;
    if (showLoading) setLoading(true);

    try {
      const email = getCookie("upmatch_email");
      const token = getCookie("up_match_token");
      if (email) setMyEmail(email);

      const cleanTarget = decodeURIComponent(targetEmail);
      const url = `${getApiBaseUrl()}/api/v1/chat/${encodeURIComponent(cleanTarget)}?target_email=${encodeURIComponent(cleanTarget)}&email=${encodeURIComponent(email || "")}`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Email": email || "",
          "Content-Type": "application/json",
        },
      });

      // ถ้าไม่มีสิทธิ์เข้าถึง (401 หรือ 403) เช่นไม่ได้แมตช์กันจริง -> แจ้งเตือนและเด้งกลับหน้าแรกทันที
      if (res.status === 401 || res.status === 403) {
        alert("คุณไม่มีสิทธิ์เข้าถึงห้องแชทนี้ เนื่องจากไม่ได้แมตช์กัน");
        window.location.replace("/");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.target_user) {
          setTargetUser(data.target_user);
          // หาก URL ปัจจุบันยังมี email (@) ให้เปลี่ยนเป็น Hash ทันทีเพื่อความเป็นส่วนตัว พร้อมคง token บน URL ไว้เสมอ
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const currentParams = new URLSearchParams(window.location.search);
            const mySig = getSessionSignature(token || email);
            if (mySig && !currentParams.get("token")) {
              currentParams.set("token", mySig);
            }
            const queryStr = currentParams.toString() ? `?${currentParams.toString()}` : "";
            const targetPath = data.target_user.hash ? `/chat/${data.target_user.hash}` : currentPath;

            if (currentPath.includes("@") || !window.location.search.includes("token=")) {
              window.history.replaceState(null, "", `${targetPath}${queryStr}`);
            }
          }
        }
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // ✅ 1. โหลดข้อมูลครั้งแรก + ใช้ Server-Sent Events (SSE) แทน polling ทุกวิ
  useEffect(() => {
    if (!targetEmail) return;

    const email = getCookie("upmatch_email");
    if (email) setMyEmail(email);

    // ดึงประวัติข้อความและข้อมูลคู่สนทนาครั้งแรกเมื่อเปิดหน้า
    fetchMessages(true);

    // เชื่อมต่อ SSE stream: จะได้รับข้อมูลเฉพาะเมื่อมีข้อความใหม่บันทึกลง Database
    const cleanTarget = decodeURIComponent(targetEmail);
    const sseUrl = `${getApiBaseUrl()}/api/v1/chat/sse?email=${encodeURIComponent(email || "")}&target_email=${encodeURIComponent(cleanTarget)}`;

    let eventSource;
    try {
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      const handleIncomingMessage = (event) => {
        try {
          const newMsg = JSON.parse(event.data);
          if (!newMsg || !newMsg.id) return;

          const currentUserEmail = getCookie("upmatch_email") || email || myEmail;
          const isMe = newMsg.sender_id === currentUserEmail;

          const formattedMsg = {
            ...newMsg,
            is_me: isMe,
          };

          setMessages((prev) => {
            // ไม่เพิ่มถ้ามี ID นี้ใน list อยู่แล้ว (ป้องกันซ้ำ)
            if (prev.some((m) => m.id === formattedMsg.id)) {
              return prev;
            }
            // แทนที่ข้อความ optimistic ชั่วคราวด้วยข้อความจริงจาก database
            const filtered = prev.filter(
              (m) => !(m.is_me && typeof m.id === "number" && m.id > 1000000000000 && m.content === formattedMsg.content)
            );
            return [...filtered, formattedMsg];
          });
        } catch (e) {
          console.error("Error parsing SSE data:", e);
        }
      };

      eventSource.addEventListener("message", handleIncomingMessage);
      eventSource.onmessage = handleIncomingMessage;

      eventSource.onerror = (err) => {
        console.warn("SSE connection status/retry:", err);
      };
    } catch (err) {
      console.error("Failed to initialize SSE:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [targetEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText("");

    const email = getCookie("upmatch_email") || myEmail;
    const token = getCookie("up_match_token");

    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      sender_id: email,
      is_me: true,
      content: text,
      created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      is_read: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/chat/send`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Email": email,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          my_email: email,
          target_email: targetUser?.email || decodeURIComponent(targetEmail),
          content: text,
        }),
      });

      if (!res.ok) {
        console.error("Send message failed:", res.status);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (res.status === 403 || res.status === 401) {
          alert("คุณไม่มีสิทธิ์ส่งข้อความเนื่องจากไม่ได้แมตช์กัน");
          window.location.replace("/");
          return;
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // ฟังก์ชันค้นหาและดึงภาพ GIF สดๆ นับล้านรูปจาก GIPHY API (รองรับทั้งภาษาไทยและอังกฤษ)
  const fetchGifs = async (query = "", category = "trending") => {
    setLoadingGifs(true);
    try {
      let url = "";
      const trimmedQuery = query.trim();

      if (trimmedQuery) {
        url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(trimmedQuery)}&limit=36&rating=g`;
      } else if (category && category !== "trending") {
        const catObj = GIF_CATEGORIES.find((c) => c.id === category);
        const catQuery = catObj?.query || category;
        url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(catQuery)}&limit=36&rating=g`;
      } else {
        url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=36&rating=g`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const formatted = (data.data || [])
          .map((item) => ({
            id: item.id,
            title: item.title || "GIF",
            url: item.images?.fixed_height?.url || item.images?.downsized?.url || item.images?.original?.url,
            previewUrl: item.images?.fixed_height_small?.url || item.images?.fixed_height?.url,
          }))
          .filter((item) => !!item.url);
        setApiGifs(formatted);
      }
    } catch (err) {
      console.error("Error fetching Giphy GIFs:", err);
    } finally {
      setLoadingGifs(false);
    }
  };

  useEffect(() => {
    if (!showGifPicker) return;

    const timer = setTimeout(() => {
      fetchGifs(gifSearch, gifCategory);
    }, gifSearch ? 350 : 0);

    return () => clearTimeout(timer);
  }, [showGifPicker, gifSearch, gifCategory]);

  const handleSendGif = async (gifUrl) => {
    if (!gifUrl || sending) return;
    setShowGifPicker(false);
    setSending(true);

    const email = getCookie("upmatch_email") || myEmail;
    const token = getCookie("up_match_token");

    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      sender_id: email,
      is_me: true,
      content: gifUrl,
      created_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      is_read: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/chat/send`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Email": email,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          my_email: email,
          target_email: targetUser?.email || decodeURIComponent(targetEmail),
          content: gifUrl,
        }),
      });

      if (!res.ok) {
        console.error("Send GIF failed:", res.status);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (res.status === 403 || res.status === 401) {
          alert("คุณไม่มีสิทธิ์ส่งข้อความเนื่องจากไม่ได้แมตช์กัน");
          window.location.replace("/");
          return;
        }
      }
    } catch (err) {
      console.error("Error sending GIF:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const icebreakers = [
    "สวัสดีครับ 👋",
    "ยินดีที่ได้แมตช์กันนะ ✨",
    "เรียนคณะอะไรเหรอครับ 🎓",
    "ชอบฟังเพลงแนวไหนเหรอ 🎵",
  ];

  const handleUnmatch = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const email = getCookie("upmatch_email") || myEmail;
      const token = getCookie("up_match_token");

      const res = await fetch(`${getApiBaseUrl()}/api/v1/chat/unmatch`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Email": email || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          my_email: email,
          target_email: targetUser?.email || targetUser?.hash || decodeURIComponent(targetEmail),
        }),
      });

      if (res.ok) {
        window.location.href = "/chat";
      } else {
        alert("เกิดข้อผิดพลาดในการยกเลิกการแมตช์");
      }
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const email = getCookie("upmatch_email") || myEmail;
      const token = getCookie("up_match_token");

      const res = await fetch(`${getApiBaseUrl()}/api/v1/chat/report`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-Email": email || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          my_email: email,
          target_email: targetUser?.email || targetUser?.hash || decodeURIComponent(targetEmail),
          reason: reportReason,
          details: reportDetails,
          also_unmatch: reportAlsoUnmatch,
        }),
      });

      if (res.ok) {
        if (reportAlsoUnmatch) {
          window.location.href = "/chat";
        } else {
          showToast("ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่ช่วยดูแลความปลอดภัย");
          setShowReportModal(false);
          setReportDetails("");
        }
      } else {
        alert("เกิดข้อผิดพลาดในการส่งรายงาน");
      }
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setActionLoading(false);
    }
  };

  const cleanTarget = targetEmail ? decodeURIComponent(targetEmail) : "";
  const displayName = targetUser?.name || (cleanTarget && cleanTarget.includes("@") ? cleanTarget.split("@")[0] : "เพื่อนใหม่");

  const getAge = () => {
    if (targetUser?.age && targetUser.age > 0) return targetUser.age;
    const rawDate = targetUser?.birth_date || targetUser?.birthDate;
    if (rawDate) {
      const birth = new Date(rawDate);
      if (!isNaN(birth.getTime()) && birth.getFullYear() > 1900) {
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        if (age > 0) return age;
      }
    }
    return targetUser?.age || 22;
  };

  const displayAge = getAge();

  return (
    <div className="fixed inset-0 h-dvh max-h-screen bg-transparent text-slate-800 flex flex-col overflow-hidden">
      {/* 1. เก็บ Navbar เอาไว้ด้านบนแบบ stationary บน Desktop & iPad แนวนอน */}
      <div className="shrink-0 z-30 desktop-block">
        <Navbar />
      </div>

      {/* 2. หน้าต่างแชท (เต็มจอไร้ขอบบนมือถือ/iPad แนวตั้ง และเป็นการ์ดลอยบนคอม/iPad แนวนอน) */}
      <main className="flex-1 min-h-0 max-w-3xl mx-auto w-full p-0 desktop-card-pad flex flex-col overflow-hidden">
        <div className="bg-white/95 backdrop-blur-xl border-0 rounded-none desktop-border desktop-rounded-3xl shadow-none desktop-shadow-xl flex flex-col h-full min-h-0 overflow-hidden">
          
          {/* Header ด้านบนของห้องแชท: ลอยอยู่เฉยๆ ตลอดเวลา ไม่ถูกเลื่อนไปด้วย */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/95 border-b border-purple-100/80 flex items-center justify-between shadow-xs z-20 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/chat"
                className="p-2 -ml-1 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-2xl transition cursor-pointer shrink-0"
                title="กลับไปหน้ารวมข้อความ"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>

              <div
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-3 min-w-0 cursor-pointer group"
                title="แตะเพื่อดูโปรไฟล์เต็ม"
              >
                <div className="relative shrink-0 group-hover:scale-105 transition-transform">
                  <UserAvatar
                    src={targetUser?.image}
                    name={displayName}
                    size="w-11 h-11"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>

                <div className="min-w-0">
                  {loading && !targetUser ? (
                    <div className="h-5 w-28 bg-purple-100 animate-pulse rounded-md" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-extrabold text-base text-slate-800 truncate group-hover:text-purple-600 transition-colors">
                        {targetUser?.name || displayName}{displayAge ? `, ${displayAge}` : ""}
                      </h2>
                      <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full hidden sm:inline group-hover:bg-purple-200 transition-colors">
                        ดูโปรไฟล์
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* จุดไข่ปลา ด้านขวาของ Header */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-2xl transition cursor-pointer"
                title="ตัวเลือกเพิ่มเติม"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Backdrop ปิดเมนู Header */}
              {showHeaderMenu && (
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowHeaderMenu(false)}
                />
              )}

              {/* เมนูดรอปดาวน์ */}
              {showHeaderMenu && (
                <div className="absolute right-0 top-11 w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-purple-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>ดูโปรไฟล์</span>
                  </button>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setShowUnmatchModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <UserX className="w-4 h-4 text-rose-500" />
                    <span>ยกเลิกการแมตช์</span>
                  </button>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Flag className="w-4 h-4 text-amber-500" />
                    <span>รายงานผู้ใช้</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* พื้นที่ข้อความแชท (แนวตั้ง): มีเพียงส่วนนี้ที่เลื่อนขึ้น-ลงได้ */}
          <div
            ref={chatScrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-purple-50/30 to-white/60"
          >
            {loading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-purple-500 gap-2">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-xs font-bold">กำลังเปิดห้องสนทนา...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-400 to-pink-400 text-white flex items-center justify-center shadow-lg shadow-purple-200 mb-4 animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base mb-1">
                  ใจตรงกันแล้ว! 🎉
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  เริ่มทักทาย {displayName} ด้วยข้อความหรือ GIF ดุ๊กดิ๊กกันเลย
                </p>

                <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                  {icebreakers.map((text, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(text)}
                      className="text-xs bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 font-medium px-3.5 py-2 rounded-full shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    msg.is_me ? "justify-end" : "justify-start"
                  }`}
                >
                  {!msg.is_me && (
                    <UserAvatar
                      src={targetUser?.image}
                      name={displayName}
                      size="w-7 h-7"
                    />
                  )}

                  {/* ตรวจสอบว่าเป็นข้อความตัวหนังสือ หรือ ภาพ GIF ดุ๊กดิ๊ก */}
                  {isGifOrImageUrl(msg.content) ? (
                    <div className="relative group overflow-hidden rounded-2xl shadow-sm border border-purple-100 bg-white/60">
                      <img
                        src={msg.content}
                        alt="GIF"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="max-w-[210px] sm:max-w-[260px] max-h-56 w-auto h-auto rounded-2xl object-cover hover:scale-[1.02] transition duration-200 block"
                      />
                      <div
                        className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold backdrop-blur-md shadow-xs ${
                          msg.is_me
                            ? "bg-purple-900/60 text-white"
                            : "bg-black/50 text-white"
                        }`}
                      >
                        <span>{msg.created_at}</span>
                        {msg.is_me && <CheckCheck className="w-2.5 h-2.5 inline ml-0.5" />}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`max-w-[78%] sm:max-w-md px-4 py-2.5 rounded-2xl shadow-xs text-sm break-words relative ${
                        msg.is_me
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-xs shadow-purple-200"
                          : "bg-white text-slate-800 border border-purple-100 rounded-bl-xs shadow-slate-100"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                      <div
                        className={`flex items-center justify-end gap-1 text-[9px] mt-1 font-medium ${
                          msg.is_me ? "text-purple-100" : "text-slate-400"
                        }`}
                      >
                        <span>{msg.created_at}</span>
                        {msg.is_me && <CheckCheck className="w-3 h-3 inline" />}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* กล่องพิมพ์ข้อความ: ลอยอยู่ด้านล่างเสมอ ไม่เลื่อนไปตามข้อความ */}
          <div className="relative p-2.5 sm:p-4 bg-white/95 border-t border-purple-100 z-20 shrink-0">
            {/* แผง Pop-up สำหรับเลือก GIF */}
            {showGifPicker && (
              <div className="absolute bottom-full mb-1.5 sm:mb-2 left-1.5 right-1.5 sm:left-4 sm:right-4 bg-white/95 backdrop-blur-xl border border-purple-200 rounded-2xl sm:rounded-3xl shadow-2xl shadow-purple-200/80 p-3 sm:p-3.5 z-30 flex flex-col max-h-[300px] sm:max-h-[360px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                {/* หัวแถบ GIF */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-100">
                  <div className="flex items-center gap-1.5 font-extrabold text-sm text-purple-900">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    <span>เลือก GIF ดุ๊กดิ๊ก</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGifPicker(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    title="ปิด"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* ค้นหา GIF */}
                <div className="relative mb-2 shrink-0">
                  <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gifSearch}
                    onChange={(e) => setGifSearch(e.target.value)}
                    placeholder="ค้นหา GIF เช่น แมว, รัก, เต้น..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-purple-50/60 border border-purple-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* หมวดหมู่ GIF */}
                <div className="flex gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none shrink-0">
                  {GIF_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setGifCategory(cat.id);
                        setGifSearch("");
                      }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition whitespace-nowrap cursor-pointer ${
                        gifCategory === cat.id && !gifSearch
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* ตารางแสดงภาพ GIF: กำหนด w-full h-24 เพื่อป้องกัน UI ซ้อนทับกันอย่างแน่นอน */}
                <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-1">
                  {loadingGifs ? (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-purple-500 gap-2">
                      <Loader2 className="w-7 h-7 animate-spin" />
                      <span className="text-xs font-semibold">กำลังค้นหา GIF ดุ๊กดิ๊ก...</span>
                    </div>
                  ) : apiGifs.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-xs text-slate-400 font-medium">
                      ไม่พบ GIF ลองค้นหาด้วยคำอื่นดูนะ ✨
                    </div>
                  ) : (
                    apiGifs.map((gif) => (
                      <div
                        key={gif.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSendGif(gif.url)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") handleSendGif(gif.url);
                        }}
                        className="group relative w-full h-24 rounded-2xl overflow-hidden border border-purple-100 hover:border-purple-400 hover:shadow-md transition-all bg-purple-50 cursor-pointer shrink-0 block"
                        title={gif.title}
                      >
                        <img
                          src={gif.previewUrl || gif.url}
                          alt={gif.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover block pointer-events-none"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition p-1 text-[10px] text-white font-bold truncate">
                          {gif.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* ปุ่มเปิดคลัง GIF */}
              <button
                type="button"
                onClick={() => setShowGifPicker((prev) => !prev)}
                className={`px-3 py-2.5 sm:py-3 rounded-2xl border transition flex items-center justify-center font-black text-xs cursor-pointer shrink-0 ${
                  showGifPicker
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                }`}
                title="เปิดคลัง GIF ดุ๊กดิ๊ก"
              >
                GIF
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`พิมพ์ข้อความถึง ${displayName}...`}
                className="flex-1 bg-purple-50/50 border border-purple-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-md shadow-purple-200 transition transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer flex items-center justify-center shrink-0"
                title="ส่งข้อความ"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>

        </div>
      </main>

      {/* Modal ยืนยันยกเลิกการแมตช์ (Unmatch) */}
      {showUnmatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-purple-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto mb-4 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
              <UserX className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1.5">
              ยกเลิกการแมตช์?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการแมตช์กับ <span className="font-bold text-slate-700">{targetUser?.name || displayName}</span>? แชทและประวัติข้อความจะถูกลบออก และจะไม่สามารถติดต่อกันได้อีก
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowUnmatchModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleUnmatch}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-md hover:from-rose-600 hover:to-pink-700 transition flex items-center justify-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>ยืนยันยกเลิก</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal รายงานผู้ใช้ (Report) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">รายงานผู้ใช้</h3>
                  <p className="text-xs text-slate-400">รายงาน {targetUser?.name || displayName} ต่อทีมงาน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                โปรดเลือกเหตุผลที่ต้องการรายงาน:
              </label>
              {[
                "พฤติกรรมไม่เหมาะสม / ก่อกวน",
                "บัญชีปลอม / สแปม / หลอกลวง",
                "รูปภาพหรือข้อความล่อแหลม",
                "คำพูดคุกคาม / หยาบคาย",
                "อื่นๆ",
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                    reportReason === reason 
                      ? 'bg-purple-50/70 border-purple-300 text-purple-900' 
                      : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="accent-purple-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                รายละเอียดเพิ่มเติม (ถ้ามี):
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="ระบุข้อความหรือพฤติกรรมที่พบ..."
                rows={2}
                className="w-full text-xs p-3 border border-purple-100 rounded-xl outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-100 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 mb-6 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={reportAlsoUnmatch}
                onChange={(e) => setReportAlsoUnmatch(e.target.checked)}
                className="rounded accent-rose-500 w-4 h-4"
              />
              <span>ยกเลิกการแมตช์และบล็อกไปพร้อมกัน</span>
            </label>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReport}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold shadow-md hover:from-amber-600 hover:to-rose-600 transition flex items-center justify-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>ส่งรายงาน</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Detail Modal (กดดูโปรไฟล์) */}
      <ProfileDetailModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={targetUser}
        actionType="chat"
      />

      {/* Toast แจ้งเตือนสถานะ */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold py-2.5 px-5 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
