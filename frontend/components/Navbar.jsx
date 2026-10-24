// frontend/components/Navbar.jsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Heart, MessageCircle, User, Sparkles, Flame } from "lucide-react";
import { getApiBaseUrl } from "@/utils/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [unreadMsg, setUnreadMsg] = useState(0);
  const [unreadMatch, setUnreadMatch] = useState(0);

  const fetchUnread = async () => {
    try {
      const getCookie = (name) => {
        if (typeof document === "undefined") return "";
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
        return "";
      };
      const email = getCookie("upmatch_email");
      const token = getCookie("up_match_token");
      if (!email) return;

      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/notifications/unread-count?email=${encodeURIComponent(email)}`, {
        headers: {
          Authorization: `Bearer ${token || email}`,
          "X-User-Email": email,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMsg(data.unread_messages || 0);
        setUnreadMatch(data.unread_matches || 0);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchUnread();

    const handleNotifEvent = (e) => {
      const { type } = e.detail || {};
      if (type === "message") {
        setUnreadMsg((prev) => prev + 1);
      } else if (type === "match") {
        setUnreadMatch((prev) => prev + 1);
      }
    };

    window.addEventListener("upmatch_notification", handleNotifEvent);
    window.addEventListener("focus", fetchUnread);

    return () => {
      window.removeEventListener("upmatch_notification", handleNotifEvent);
      window.removeEventListener("focus", fetchUnread);
    };
  }, []);

  // เมื่อผู้ใช้อยู่หน้า /chat หรือ /matches ให้เคลียร์ badge ของหน้านั้น
  useEffect(() => {
    if (pathname?.startsWith("/chat")) {
      setUnreadMsg(0);
    }
    if (pathname === "/matches") {
      setUnreadMatch(0);
    }
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = "upmatch_email=; path=/; max-age=0";
    document.cookie = "up_match_token=; path=/; max-age=0";
    router.push("/");
  };

  const navItems = [
    { name: "ปัดหาเพื่อน", path: "/swipe", icon: Flame, badge: 0 },
    { name: "ใครแอบชอบ", path: "/likes", icon: Sparkles, badge: 0 },
    { name: "ใจตรงกัน", path: "/matches", icon: Heart, badge: unreadMatch },
    { name: "แชท", path: "/chat", icon: MessageCircle, badge: unreadMsg },
  ];

  // ถ้าอยู่ในห้องแชทของคู่สนทนาแบบเฉพาะเจาะจง (/chat/[id])
  // บนมือถือจะไม่แสดง Navbar ใดๆ ทั้งบนและล่าง เพื่อให้แชทเต็มหน้าจอเหมือน Line/Messenger
  const isInsideDirectChat = pathname?.startsWith("/chat/") && pathname !== "/chat";

  return (
    <>
      {/* 1. TOP NAVBAR (แสดงเต็มรูปแบบบน Desktop & iPad แนวนอน ส่วนบนมือถือและ iPad แนวตั้งจะแสดงแบบย่อกะทัดรัด) */}
      <header className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100/80 shadow-xs ${isInsideDirectChat ? "desktop-block" : ""}`}>
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 md:h-18 flex items-center justify-between">
          
          {/* ส่วนโลโก้และชื่อเว็บ */}
          <Link href="/swipe" className="flex items-center gap-2 sm:gap-3 cursor-pointer">
            <img
              src="/logo.png"
              alt="UP Match Logo"
              className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 object-contain shrink-0"
            />
            <div className="leading-tight">
              <span className="font-extrabold text-base sm:text-lg md:text-xl tracking-tight bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                UP Match
              </span>
              <span className="hidden sm:block text-[10px] md:text-[11px] font-bold text-purple-600">
                UP Community
              </span>
            </div>
          </Link>

          {/* เมนูหลักบน Desktop & iPad แนวนอน (desktop-flex) */}
          <nav className="desktop-flex items-center gap-1.5 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path === "/chat" && pathname?.startsWith("/chat"));
              
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl transition font-bold text-xs lg:text-sm cursor-pointer
                      ${isActive 
                        ? "bg-purple-100 text-purple-700 shadow-xs border border-purple-200" 
                        : "text-slate-600 hover:bg-purple-50 hover:text-purple-700"
                      }`}
                  >
                    <div className="relative">
                      <Icon className={`w-4 h-4 lg:w-4.5 lg:h-4.5 ${isActive && item.name === "ใจตรงกัน" ? "fill-purple-700 text-purple-700" : ""}`} />
                      {item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </div>
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}

            <Link href="/profile">
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl transition font-bold text-xs lg:text-sm border ml-1 cursor-pointer
                ${pathname === "/profile" ? "bg-pink-100 text-pink-700 border-pink-200" : "bg-white text-pink-600 border-pink-100 hover:bg-pink-50"}`}>
                <User className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
                <span>โปรไฟล์</span>
              </div>
            </Link>
          </nav>

          {/* ปุ่มออกจากระบบ */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-50 border border-rose-100/70 transition cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">ออก</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. BOTTOM NAVIGATION BAR (สำหรับมือถือ และ iPad แนวตั้ง เท่านั้น) */}
      {!isInsideDirectChat && (
        <nav className="mobile-flex fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-purple-100/90 px-2 pt-1 pb-safe shadow-lg shadow-purple-900/10 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path === "/chat" && pathname?.startsWith("/chat"));

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition cursor-pointer ${
                  isActive ? "text-purple-600 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
                }`}
              >
                <div className="relative">
                  <div className={`p-1 rounded-xl transition ${isActive ? "bg-purple-100" : ""}`}>
                    <Icon className={`w-5 h-5 ${isActive && item.name === "ใจตรงกัน" ? "fill-purple-600 text-purple-600" : ""}`} />
                  </div>
                  {item.badge > 0 && (
                    <span className="absolute -top-0.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
              </Link>
            );
          })}

          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition cursor-pointer ${
              pathname === "/profile" ? "text-pink-600 font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
            }`}
          >
            <div className={`p-1 rounded-xl transition ${pathname === "/profile" ? "bg-pink-100" : ""}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">โปรไฟล์</span>
          </Link>
        </nav>
      )}
    </>
  );
}