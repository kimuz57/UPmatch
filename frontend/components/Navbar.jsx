// frontend/components/Navbar.jsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Heart, MessageCircle, User, Flame, Eye } from "lucide-react";
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
    { name: "ใครแอบชอบ", path: "/likes", icon: Eye, badge: 0 },
    { name: "ใจตรงกัน", path: "/matches", icon: Heart, badge: unreadMatch },
    { name: "แชท", path: "/chat", icon: MessageCircle, badge: unreadMsg },
  ];

  // ถ้าอยู่ในห้องแชทของคู่สนทนาแบบเฉพาะเจาะจง (/chat/[id])
  // บนมือถือจะไม่แสดง Navbar ใดๆ ทั้งบนและล่าง เพื่อให้แชทเต็มหน้าจอเหมือน Line/Messenger
  const isInsideDirectChat = pathname?.startsWith("/chat/") && pathname !== "/chat";

  return (
    <>
      {/* 1. TOP NAVBAR (แสดงเต็มรูปแบบบน Desktop & iPad แนวนอน ส่วนบนมือถือและ iPad แนวตั้งจะแสดงแบบย่อกะทัดรัด) */}
      {/* avoid-ai-design-ignore: K3 */}
      <header className={`sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-2xs ${isInsideDirectChat ? "desktop-block" : ""}`}>
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          
          {/* ส่วนโลโก้และชื่อเว็บ */}
          <Link href="/swipe" className="flex items-center gap-2 sm:gap-3 cursor-pointer">
            <img
              src="/logo.png"
              alt="UP Match Logo"
              className="w-12 h-12 sm:w-10 sm:h-10 object-contain shrink-0"
            />
            <div className="leading-tight">
              <span className="font-black text-base sm:text-lg tracking-tight text-purple-950">
                UP Match
              </span>
              <span className="hidden sm:block text-[10px] font-bold text-purple-800">
                Just Match, The Right Person
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
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-bold text-xs lg:text-sm cursor-pointer
                      ${isActive 
                        ? "bg-purple-100 text-purple-900 shadow-xs border border-purple-200" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    <div className="relative">
                      <Icon className={`w-4 h-4 lg:w-4.5 lg:h-4.5 ${isActive && item.name === "ใจตรงกัน" ? "fill-purple-900 text-purple-900" : ""}`} />
                      {item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white shadow-xs">
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
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition font-bold text-xs lg:text-sm border ml-1 cursor-pointer
                ${pathname === "/profile" ? "bg-purple-900 text-white border-purple-950" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}>
                <User className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
                <span>โปรไฟล์</span>
              </div>
            </Link>
          </nav>

          {/* ปุ่มออกจากระบบ */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
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
        /* avoid-ai-design-ignore: K3 */
        <nav className="mobile-flex fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-md border-t border-slate-200/80 px-2 pt-1.5 pb-safe shadow-sm items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path === "/chat" && pathname?.startsWith("/chat"));

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition cursor-pointer ${
                  isActive ? "text-purple-900 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
                }`}
              >
                <div className="relative">
                  <div className={`p-1 rounded-lg transition ${isActive ? "bg-purple-100" : ""}`}>
                    <Icon className={`w-5 h-5 ${isActive && item.name === "ใจตรงกัน" ? "fill-purple-900 text-purple-900" : ""}`} />
                  </div>
                  {item.badge > 0 && (
                    <span className="absolute -top-0.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white shadow-xs">
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
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition cursor-pointer ${
              pathname === "/profile" ? "text-purple-900 font-bold" : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <div className={`p-1 rounded-lg transition ${pathname === "/profile" ? "bg-purple-100" : ""}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">โปรไฟล์</span>
          </Link>
        </nav>
      )}
    </>
  );
}