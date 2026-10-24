// frontend/components/GlobalNotification.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, X } from "lucide-react";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";

// 🎵 ฟังก์ชันสร้างเสียงแจ้งเตือนผ่าน Web Audio API (ไม่ต้องพึ่งไฟล์ MP3, ทำงานได้ 100% ทุกบราวเซอร์)
function playNotificationChime(type = "message") {
  try {
    const settingsStr = typeof window !== "undefined" ? localStorage.getItem("upmatch_settings") : null;
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      if (settings.soundAlert === false) return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;

    if (type === "match") {
      // 🎶 เสียงหวานสดใสสำหรับ Match (E5 -> G#5 -> B5 -> E6)
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.18, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } else {
      // 🔔 เสียงกระดิ่งข้อความใส 2 จังหวะ (G5 -> C6)
      [783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.16, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    }
  } catch (err) {
    // AudioContext might be blocked until user interacts with the page
  }
}

export function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return false;
    }

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/v1/notifications/vapid-key`);
    if (!res.ok) return false;
    const { public_key } = await res.json();
    if (!public_key) return false;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(public_key),
      });
    }

    const value = `; ${document.cookie}`;
    const parts = value.split(`; upmatch_email=`);
    const email = parts.length === 2 ? decodeURIComponent(parts.pop().split(";").shift()) : (localStorage.getItem("upmatch_email") || "");

    await fetch(`${baseUrl}/api/v1/notifications/push-subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        subscription: subscription,
      }),
    });

    return true;
  } catch (err) {
    console.error("Push subscribe error:", err);
    return false;
  }
}

export default function GlobalNotification() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeToast, setActiveToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // ลงทะเบียน Service Worker เมื่อเปิดแอป
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            subscribeUserToPush();
          }
        })
        .catch(() => {});
    }

    const handleReqPush = () => subscribeUserToPush();
    window.addEventListener("upmatch_request_push", handleReqPush);
    return () => {
      window.removeEventListener("upmatch_request_push", handleReqPush);
    };
  }, []);

  const getUserEmail = () => {
    if (typeof document === "undefined") return "";
    const value = `; ${document.cookie}`;
    const parts = value.split(`; upmatch_email=`);
    if (parts.length === 2) {
      const email = decodeURIComponent(parts.pop().split(";").shift()).trim();
      if (email) return email;
    }
    const tokenParts = value.split(`; up_match_token=`);
    if (tokenParts.length === 2) {
      const token = decodeURIComponent(tokenParts.pop().split(";").shift()).trim();
      if (token && token.includes("@")) return token;
    }
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("upmatch_email") || sessionStorage.getItem("upmatch_email");
      if (local) return local.trim();
      const params = new URLSearchParams(window.location.search);
      const qEmail = params.get("email");
      if (qEmail) return qEmail.trim();
    }
    return "";
  };

  const showToast = (toast) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setActiveToast(toast);

    const duration = toast.type === "match" ? 6000 : 4500;
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, duration);
  };

  const dismissToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setActiveToast(null);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const email = getUserEmail();
    if (!email) return;

    let eventSource = null;
    let reconnectTimeout = null;

    const connectSSE = () => {
      try {
        const baseUrl = getApiBaseUrl();
        const sseUrl = `${baseUrl}/api/v1/chat/sse?email=${encodeURIComponent(email)}`;
        eventSource = new EventSource(sseUrl, { withCredentials: true });

        // 💌 เมื่อมีข้อความใหม่เข้ามา
        const handleMessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (!data || !data.id) return;

            // ตรวจสอบการตั้งค่าเปิด/ปิดการแจ้งเตือน
            const settingsStr = localStorage.getItem("upmatch_settings");
            let notifyMsg = true;
            if (settingsStr) {
              const settings = JSON.parse(settingsStr);
              if (settings.notifyMessage === false) notifyMsg = false;
            }

            // ถ้าเป็นข้อความของเราเอง ไม่ต้องแจ้งเตือน
            const myEmail = getUserEmail();
            if (data.is_me || (data.sender_id && data.sender_id.toLowerCase() === myEmail.toLowerCase())) {
              return;
            }

            // ส่ง event บอก Navbar ให้อัปเดตตัวเลขนับข้อความทันที
            window.dispatchEvent(
              new CustomEvent("upmatch_notification", {
                detail: { type: "message", data },
              })
            );

            // ถ้ากำลังเปิดหน้าแชทกับคนๆ นี้อยู่แล้ว ไม่ต้องแสดง Toast บังหน้าจอ
            const currentPath = window.location.pathname;
            const targetHash = data.sender_hash || "";
            const targetId = data.sender_id || "";
            const isInsideThisChat =
              currentPath === `/chat/${targetHash}` ||
              currentPath === `/chat/${encodeURIComponent(targetId)}` ||
              currentPath === `/chat/${targetId}`;

            if (isInsideThisChat) {
              return;
            }

            // เล่นเสียงแจ้งเตือน
            playNotificationChime("message");

            // แสดง In-App Toast แบนเนอร์ลอยด้านบน
            if (notifyMsg) {
              let displayContent = data.content || "";
              if (/^https?:\/\/.*(giphy\.com|tenor\.com|\.gif)/i.test(displayContent)) {
                displayContent = "[ส่ง GIF] 🎬";
              } else if (/^https?:\/\/.*(\.png|\.jpe?g|\.webp)/i.test(displayContent)) {
                displayContent = "[ส่งรูปภาพ] 📷";
              }

              showToast({
                type: "message",
                title: data.sender_name || "เพื่อนใน UP Match",
                content: displayContent,
                image: data.sender_image || "/logo.png",
                link: `/chat/${data.sender_hash || data.sender_id}`,
                time: data.created_at || "เมื่อสักครู่",
              });
            }

            // ยิง Native Notification เมื่อผู้ใช้ไม่ได้เปิดแท็บนี้อยู่
            if (document.hidden && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              const notif = new Notification(data.sender_name || "UP Match", {
                body: data.content || "ส่งข้อความใหม่ถึงคุณ",
                icon: formatImageUrl(data.sender_image) || "/logo.png",
              });
              notif.onclick = () => {
                window.focus();
                router.push(`/chat/${data.sender_hash || data.sender_id}`);
              };
            }
          } catch (err) {
            console.error("Error processing SSE message:", err);
          }
        };

        eventSource.addEventListener("message", handleMessage);
        eventSource.onmessage = handleMessage;

        // 🎉 เมื่อเกิด MATCH ใหม่!
        eventSource.addEventListener("match", (e) => {
          try {
            const data = JSON.parse(e.data);
            if (!data) return;

            // ตรวจสอบการตั้งค่าเปิด/ปิดการแจ้งเตือน Match
            const settingsStr = localStorage.getItem("upmatch_settings");
            let notifyMatch = true;
            if (settingsStr) {
              const settings = JSON.parse(settingsStr);
              if (settings.notifyMatch === false) notifyMatch = false;
            }

            // ส่ง event บอก Navbar ให้อัปเดตตัวเลข Match ทันที
            window.dispatchEvent(
              new CustomEvent("upmatch_notification", {
                detail: { type: "match", data },
              })
            );

            // เล่นเสียงแจ้งเตือนหวานๆ ของ Match
            playNotificationChime("match");

            if (notifyMatch) {
              const matched = data.matched_user || {};
              showToast({
                type: "match",
                title: data.title || "ใจตรงกันแล้ว! 🎉",
                content: data.message || `คุณกับ ${matched.name || "เพื่อนใหม่"} ใจตรงกันแล้ว!`,
                image: matched.image || "/logo.png",
                link: `/chat/${matched.hash || matched.id || ""}`,
                time: data.time || "เมื่อสักครู่",
                matchedUser: matched,
              });
            }

            // ยิง Native Notification
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              const matched = data.matched_user || {};
              const notif = new Notification("ใจตรงกันแล้ว! 🎉 UP Match", {
                body: `คุณกับ ${matched.name || "เพื่อนใหม่"} ใจตรงกันแล้ว เริ่มแชทได้เลย!`,
                icon: formatImageUrl(matched.image) || "/logo.png",
              });
              notif.onclick = () => {
                window.focus();
                router.push(`/chat/${matched.hash || matched.id || ""}`);
              };
            }
          } catch (err) {
            console.error("Error processing SSE match:", err);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
          }
          // ลองเชื่อมต่อใหม่ทุก 5 วินาที
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    const handleVisibility = () => {
      if (!document.hidden && (!eventSource || eventSource.readyState === EventSource.CLOSED)) {
        connectSSE();
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  const handleToastClick = () => {
    if (!activeToast) return;
    const dest = activeToast.link;
    dismissToast();
    if (dest) {
      router.push(dest);
    }
  };

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -70, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 450, damping: 30 }}
          className="fixed top-3 sm:top-5 left-0 right-0 z-[9999] flex justify-center px-3.5 sm:px-4 pointer-events-none"
        >
          <div
            onClick={handleToastClick}
            className={`pointer-events-auto flex items-center gap-3 p-3 sm:p-3.5 max-w-md w-full rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl border cursor-pointer transition transform active:scale-98 ${
              activeToast.type === "match"
                ? "bg-gradient-to-r from-pink-500/95 via-purple-600/95 to-indigo-600/95 text-white border-pink-300/40 shadow-pink-500/25"
                : "bg-white/95 text-slate-800 border-purple-100/90 shadow-purple-900/15"
            }`}
          >
            {/* รูปโปรไฟล์พร้อม Badge เล็ก */}
            <div className="relative shrink-0">
              <img
                src={formatImageUrl(activeToast.image) || "/logo.png"}
                alt={activeToast.title}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover ring-2 ring-white/80 shadow-md"
                onError={(e) => {
                  e.currentTarget.src = "/logo.png";
                }}
              />
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm ${
                  activeToast.type === "match" ? "bg-pink-500 text-white ring-2 ring-white" : "bg-purple-600 text-white ring-2 ring-white"
                }`}
              >
                {activeToast.type === "match" ? (
                  <Heart className="w-3 h-3 fill-white text-white" />
                ) : (
                  <MessageCircle className="w-3 h-3 fill-white text-white" />
                )}
              </div>
            </div>

            {/* เนื้อหาการแจ้งเตือน */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-xs font-black truncate ${
                    activeToast.type === "match" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {activeToast.title}
                </span>
                <span
                  className={`text-[10px] font-medium shrink-0 ${
                    activeToast.type === "match" ? "text-pink-100" : "text-slate-400"
                  }`}
                >
                  {activeToast.time}
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 line-clamp-1 leading-snug ${
                  activeToast.type === "match" ? "text-pink-50 font-medium" : "text-slate-600 font-normal"
                }`}
              >
                {activeToast.content}
              </p>
            </div>

            {/* ปุ่มปิด */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissToast();
              }}
              className={`p-1.5 rounded-full transition shrink-0 ${
                activeToast.type === "match"
                  ? "hover:bg-white/20 text-white/80 hover:text-white"
                  : "hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
