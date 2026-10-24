// frontend/components/ProfileDetailModal.jsx
"use client";

import React, { useState } from "react";
import { formatImageUrl } from "@/utils/api";
import {
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Quote,
  Brain,
  Palette,
  MapPin,
  Heart,
  MessageCircle,
  Smile,
} from "lucide-react";

export default function ProfileDetailModal({
  isOpen,
  onClose,
  user,
  onAction,
  actionType = "none", // "chat" | "swipe" | "none"
}) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!isOpen || !user) return null;

  // รวบรวมรูปภาพทั้งหมด (เรียงตาม DisplayOrder)
  const images =
    user.images && Array.isArray(user.images) && user.images.length > 0
      ? user.images
      : user.image
      ? [user.image]
      : ["/logo.png"];

  const currentPhoto = images[activePhotoIdx] || images[0] || "/logo.png";

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // แยกงานอดิเรกเป็น tag ย่อยๆ ถ้ามี
  const hobbiesList = user.hobbies
    ? user.hobbies
        .split(/[,，、]+/)
        .map((h) => h.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-purple-100 relative">
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition transform hover:scale-110 active:scale-95 cursor-pointer"
          title="ปิด"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#f1d6fa_transparent]">
          {/* 1. ส่วนรูปภาพหลัก (Main Photo with Tinder Touch Navigation) */}
          <div className="relative aspect-[4/5] bg-slate-900 overflow-hidden select-none">
            <img
              src={formatImageUrl(currentPhoto)}
              alt={user.name || "User Profile"}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Tinder Progress Dots */}
            {images.length > 1 && (
              <div className="absolute top-3 inset-x-3 z-20 flex gap-1.5 px-1">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
                      i === activePhotoIdx
                        ? "bg-white shadow-sm"
                        : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Tap Zones for Left / Right Photo Switch */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-0 inset-y-0 w-1/3 z-10 cursor-pointer flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
                  title="รูปก่อนหน้า"
                >
                  <span className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs">
                    <ChevronLeft className="w-5 h-5" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-0 inset-y-0 w-1/3 z-10 cursor-pointer flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
                  title="รูปถัดไป"
                >
                  <span className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs">
                    <ChevronRight className="w-5 h-5" />
                  </span>
                </button>
              </>
            )}

            {/* Bottom Info on Photo */}
            <div className="absolute bottom-4 left-4 right-4 z-20 text-white pointer-events-none">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black drop-shadow-md">
                  {user.name}
                  {user.age ? `, ${user.age}` : ""}
                </h1>
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  ✓ ยืนยันแล้ว
                </span>
              </div>
              <p className="text-xs text-white/90 drop-shadow mt-0.5 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-pink-400" /> มหาวิทยาลัยพะเยา
                {user.faculty ? ` • ${user.faculty}` : ""}
              </p>
            </div>
          </div>

          {/* 2. แสดงรูปภาพเรียงๆ ทั้งหมด ("จะโชว รูปเรียงๆ") */}
          {images.length > 1 && (
            <div className="p-3.5 bg-slate-50 border-b border-purple-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">
                  รูปภาพทั้งหมด ({images.length} รูป)
                </span>
                <span className="text-[10px] text-purple-600 font-semibold">
                  แตะที่รูปเพื่อดูภาพใหญ่
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {images.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActivePhotoIdx(i)}
                    className={`relative w-16 h-20 sm:w-18 sm:h-22 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      i === activePhotoIdx
                        ? "border-purple-600 ring-2 ring-purple-400/50 scale-105 shadow-md"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={formatImageUrl(imgUrl)}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-purple-600/90 text-white text-[8px] font-bold text-center py-0.5">
                        รูปหลัก
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. รายละเอียดต่างๆ (แคปชั่น, MBTI, งานอดิเรก, คณะ, ฯลฯ) */}
          <div className="p-5 space-y-4">
            {/* แคปชั่นแนะนำตัว */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 to-pink-50/40 border border-purple-100">
              <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs mb-1.5">
                <Quote className="w-4 h-4 text-purple-500" />
                <span>แคปชั่น / แนะนำตัว</span>
              </div>
              {user.caption || user.bio ? (
                <p className="text-sm font-bold text-slate-800 leading-relaxed">
                  "{user.caption || user.bio}"
                </p>
              ) : (
                <div className="text-xs">
                  <span className="font-bold text-slate-400 block mb-0.5">-</span>
                  <p className="text-pink-600 font-medium italic">
                    เขาไม่ได้เพิ่มข้อมูลส่วนนี้ อยากรู้ก็ทักไปถามเลย 😉
                  </p>
                </div>
              )}
            </div>

            {/* คณะที่เรียน */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mb-1.5">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>คณะที่ศึกษา</span>
              </div>
              {user.faculty && user.faculty !== "-" ? (
                <p className="text-sm font-bold text-slate-800">{user.faculty}</p>
              ) : (
                <div className="text-xs">
                  <span className="font-bold text-slate-400 block mb-0.5">-</span>
                  <p className="text-purple-600 font-medium italic">
                    มหาวิทยาลัยพะเยา (เด็ก มพ. แน่นอน ทักถามสาขาได้เลย 🎓)
                  </p>
                </div>
              )}
            </div>

            {/* MBTI */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mb-1.5">
                <Brain className="w-4 h-4 text-pink-500" />
                <span>บุคลิกภาพ (MBTI)</span>
              </div>
              {user.mbti && user.mbti !== "-" ? (
                <div className="inline-block px-3 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-extrabold text-xs shadow-xs">
                  {user.mbti}
                </div>
              ) : (
                <div className="text-xs">
                  <span className="font-bold text-slate-400 block mb-0.5">-</span>
                  <p className="text-pink-600 font-medium italic">
                    ไม่บอกนิสัย อยากรู้ต้องทักมาทำความรู้จักเองนะ ✨
                  </p>
                </div>
              )}
            </div>

            {/* งานอดิเรก */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mb-1.5">
                <Palette className="w-4 h-4 text-amber-500" />
                <span>งานอดิเรกที่ชอบ</span>
              </div>
              {hobbiesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {hobbiesList.map((hobby, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1 rounded-full font-medium shadow-2xs"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs">
                  <span className="font-bold text-slate-400 block mb-0.5">-</span>
                  <p className="text-amber-700 font-medium italic">
                    เขาไม่ได้ลงไว้ ทักไปถามดู เผื่อมีเวลาว่างตรงกัน 🧋
                  </p>
                </div>
              )}
            </div>

            {/* เพศ & ความสนใจ */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">เพศ</span>
                <span className="font-bold text-slate-800">{user.gender || "-"}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold mb-0.5">สนใจ</span>
                <span className="font-bold text-slate-800">{user.preference || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-white border-t border-purple-50 shrink-0">
          {actionType === "chat" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-purple-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              คุยกับ {user.name} ต่อเลย
            </button>
          ) : actionType === "swipe" ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAction?.("left");
                }}
                className="w-1/2 py-3 rounded-2xl bg-slate-100 hover:bg-rose-50 text-rose-500 font-bold text-sm border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[3]" />
                ข้าม
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAction?.("right");
                }}
                className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-md shadow-pink-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white" />
                ถูกใจ
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
