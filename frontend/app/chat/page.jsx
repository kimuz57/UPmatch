"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  MessageCircle,
  Search,
  Loader2,
  MoreVertical,
  UserX,
  Flag,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { getSessionSignature } from "@/utils/session";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";

function formatLastMessage(msg, isLastFromMe = false) {
  if (!msg) return "เริ่มบทสนทนากันเลย!";
  let text = msg.trim();

  const hasPrefix = text.startsWith("คุณ : ");
  if (hasPrefix) {
    text = text.slice(6).trim();
  }

  const isMe = isLastFromMe || hasPrefix;

  let formatted = text;
  if (
    /^https?:\/\/.*(giphy\.com|tenor\.com|\.gif)/i.test(text) ||
    text === "[ส่ง GIF]" ||
    text === "ส่ง GIF" ||
    text === "[ส่ง GIF]"
  ) {
    formatted = "[ส่ง GIF]";
  } else if (
    /^https?:\/\/.*(\.png|\.jpe?g|\.webp)/i.test(text) ||
    text === "[ส่งรูปภาพ]"
  ) {
    formatted = "[ส่งรูปภาพ]";
  }

  return isMe ? `คุณ : ${formatted}` : formatted;
}

export default function ChatPage() {
  const [chatList, setChatList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionSig, setSessionSig] = useState("");

  // สเตตสำหรับเมนูจุดไข่ปลา, อันแมตช์ และ รายงาน
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [unmatchTarget, setUnmatchTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("พฤติกรรมไม่เหมาะสม / ก่อกวน");
  const [reportDetails, setReportDetails] = useState("");
  const [reportAlsoUnmatch, setReportAlsoUnmatch] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const fetchChats = async () => {
    try {
      const getCookie = (name) => {
        if (typeof document === "undefined") return "";
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return "";
      };
      const token = getCookie("up_match_token");
      const email = getCookie("upmatch_email");

      const tok = token || email;
      if (tok) {
        setSessionSig(getSessionSignature(tok));
      }

      const baseUrl = getApiBaseUrl();
      const url = email
        ? `${baseUrl}/api/v1/chats?email=${encodeURIComponent(email)}`
        : `${baseUrl}/api/v1/chats`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-User-Email": email || "",
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const incoming = (data.chats || []).slice().sort((a, b) => {
          const timeA = a.timestamp ? Number(a.timestamp) : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
          const timeB = b.timestamp ? Number(b.timestamp) : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
          return timeB - timeA;
        });
        setChatList(incoming);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();

    const getCookie = (name) => {
      if (typeof document === "undefined") return "";
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
      return "";
    };
    const email = getCookie("upmatch_email");

    // 🚀 เชื่อมต่อ SSE เพื่อรับการแจ้งเตือน Realtime เมื่อ Database มีการเปลี่ยนแปลง (มีข้อความใหม่หรือเกิดการเปลี่ยนแปลง)
    let eventSource;
    if (email) {
      try {
        const baseUrl = getApiBaseUrl();
        const sseUrl = `${baseUrl}/api/v1/chat/sse?email=${encodeURIComponent(email)}`;
        eventSource = new EventSource(sseUrl, { withCredentials: true });

        const handleIncoming = () => {
          // รีเฟรชรายการแชทใหม่ทันที จัดเรียงใหม่ให้อัตโนมัติเมื่อมีข้อความเข้าหรือออกจากใครก็ตาม
          fetchChats();
        };

        eventSource.addEventListener("message", handleIncoming);
        eventSource.addEventListener("match", handleIncoming);
        eventSource.onmessage = handleIncoming;
        eventSource.onerror = () => {
          // EventSource จะพยายามเชื่อมต่อใหม่ให้อัตโนมัติเมื่อหลุด
        };
      } catch (err) {
        console.error("Failed to connect inbox SSE:", err);
      }
    }

    const handleFocus = () => fetchChats();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("upmatch_notification", handleFocus);
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("upmatch_notification", handleFocus);
    };
  }, []);

  const handleUnmatch = async () => {
    if (!unmatchTarget || actionLoading) return;
    setActionLoading(true);
    try {
      const getCookie = (name) => {
        if (typeof document === "undefined") return "";
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return "";
      };
      const token = getCookie("up_match_token");
      const email = getCookie("upmatch_email");

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
          target_email: unmatchTarget.id,
        }),
      });

      if (res.ok) {
        setChatList((prev) => prev.filter((c) => c.id !== unmatchTarget.id));
        showToast(`ยกเลิกการแมตช์กับ ${unmatchTarget.name} แล้ว`);
        setUnmatchTarget(null);
      } else {
        alert("เกิดข้อผิดพลาดในการยกเลิกการแมตช์");
      }
    } catch (e) {
      console.error("Unmatch error:", e);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportTarget || actionLoading) return;
    setActionLoading(true);
    try {
      const getCookie = (name) => {
        if (typeof document === "undefined") return "";
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return "";
      };
      const token = getCookie("up_match_token");
      const email = getCookie("upmatch_email");

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
          target_email: reportTarget.id,
          reason: reportReason,
          details: reportDetails,
          also_unmatch: reportAlsoUnmatch,
        }),
      });

      if (res.ok) {
        if (reportAlsoUnmatch) {
          setChatList((prev) => prev.filter((c) => c.id !== reportTarget.id));
        }
        showToast("ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่ช่วยดูแลความปลอดภัย");
        setReportTarget(null);
        setReportDetails("");
      } else {
        alert("เกิดข้อผิดพลาดในการส่งรายงาน");
      }
    } catch (e) {
      console.error("Report error:", e);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredChats = chatList
    .slice()
    .sort((a, b) => {
      const timeA = a.timestamp ? Number(a.timestamp) : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      const timeB = b.timestamp ? Number(b.timestamp) : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      return timeB - timeA;
    })
    .filter((c) =>
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="h-dvh max-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 text-slate-800 flex flex-col overflow-hidden">
      <div className="shrink-0 z-30">
        <Navbar />
      </div>

      {/* Backdrop ปิดเมนูเมื่อคลิกนอกพื้นที่ */}
      {activeMenuId && (
        <div
          className="fixed inset-0 z-20"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveMenuId(null);
          }}
        />
      )}

      <main className="flex-1 min-h-0 overflow-y-auto max-w-2xl mx-auto w-full px-3.5 sm:px-4 py-3 sm:py-6 page-bottom-padding">
        <div className="mb-6 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-black text-slate-800">ข้อความ</h1>
        </div>

        <div className="relative mb-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อเพื่อน..."
            className="w-full bg-white border border-purple-100 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
            <p className="text-sm text-purple-500 font-bold">กำลังโหลดข้อความ...</p>
          </div>
        ) : filteredChats.length > 0 ? (
          <div className="space-y-3">
            {filteredChats.map((chat) => {
              const hasUnread = (chat.unread || 0) > 0;
              const formattedMsg = formatLastMessage(chat.lastMessage, chat.isLastFromMe);
              const isMenuOpen = activeMenuId === chat.id;

              return (
                <div key={chat.id} className="relative group">
                  <Link
                    href={`/chat/${chat.id}${sessionSig ? `?token=${sessionSig}` : ""}`}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition shadow-xs border block ${hasUnread
                      ? 'bg-purple-50/70 border-purple-200/80 hover:bg-purple-100/60 shadow-sm'
                      : 'bg-white border-purple-50/60 hover:bg-purple-50/40'
                      }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={formatImageUrl(chat.image)}
                        alt={chat.name}
                        className="w-13 h-13 rounded-full object-cover border border-purple-100"
                      />
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-pink-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`truncate ${hasUnread ? 'font-bold text-slate-900 text-sm' : 'font-medium text-slate-700 text-sm'}`}>
                          {chat.name}
                        </h3>
                        <span className={`text-[11px] shrink-0 mr-4 ${hasUnread ? 'text-pink-600 font-bold' : 'text-slate-400 font-normal'}`}>
                          {chat.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate flex-1 min-w-0 ${hasUnread ? 'text-slate-900 font-bold' : 'text-slate-500 font-normal'}`}>
                          {formattedMsg}
                        </p>
                        {hasUnread && (
                          <span className="shrink-0 mr-4 min-w-5 h-5 px-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs">
                            {chat.unread > 99 ? '99+' : chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* ปุ่มจุดไข่ปลา (Three dots menu) */}
                  <div className="absolute top-3.5 right-2.5 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenuId(isMenuOpen ? null : chat.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-100/70 rounded-full transition cursor-pointer"
                      title="ตัวเลือกเพิ่มเติม"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* เมนูดรอปดาวน์ */}
                    {isMenuOpen && (
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="absolute right-0 top-8 w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-purple-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setUnmatchTarget(chat);
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
                            setActiveMenuId(null);
                            setReportTarget(chat);
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
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm font-medium">
            {searchTerm ? "ไม่พบเพื่อนที่ค้นหา" : "ยังไม่มีข้อความสนทนา"}
          </div>
        )}
      </main>

      {/* Modal ยืนยันยกเลิกการแมตช์ (Unmatch) */}
      {unmatchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-purple-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto mb-4 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
              <UserX className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1.5">
              ยกเลิกการแมตช์?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการแมตช์กับ <span className="font-bold text-slate-700">{unmatchTarget.name}</span>? แชทและประวัติข้อความจะถูกลบออก และจะไม่สามารถติดต่อกันได้อีก
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setUnmatchTarget(null)}
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
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">รายงานผู้ใช้</h3>
                  <p className="text-xs text-slate-400">รายงาน {reportTarget.name} ต่อทีมงาน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportTarget(null)}
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
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition ${reportReason === reason
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
                onClick={() => setReportTarget(null)}
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

      {/* Toast แจ้งเตือนสถานะ */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold py-2.5 px-5 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}