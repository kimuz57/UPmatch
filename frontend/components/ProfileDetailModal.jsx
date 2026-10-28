// frontend/components/ProfileDetailModal.jsx
"use client";

import React, { useState } from "react";
import { formatImageUrl } from "@/utils/api";
import {
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Quote,
  Brain,
  Palette,
  MapPin,
  Heart,
  MessageCircle,
  Ruler,
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

  const hobbiesList = user.hobbies
    ? user.hobbies
        .split(/[,，、]+/)
        .map((h) => h.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden shadow-xl border border-slate-200 relative">
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="ปิด"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
          {/* Main Photo with Touch Navigation */}
          <div className="relative aspect-[4/5] bg-slate-900 overflow-hidden select-none">
            <img
              src={formatImageUrl(currentPhoto)}
              alt={user.name || "User Profile"}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/20 pointer-events-none" />

            {/* Photo Navigation Progress */}
            {images.length > 1 && (
              <div className="absolute top-3 inset-x-3 z-20 flex gap-1 px-1">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
                      i === activePhotoIdx
                        ? "bg-white shadow-xs"
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
                  <span className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center">
                    <ChevronLeft className="w-4 h-4" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-0 inset-y-0 w-1/3 z-10 cursor-pointer flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
                  title="รูปถัดไป"
                >
                  <span className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </button>
              </>
            )}

            {/* Bottom Info on Photo */}
            <div className="absolute bottom-4 left-4 right-4 z-20 text-white pointer-events-none">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black drop-shadow-xs">
                  {user.name}
                  {user.age ? `, ${user.age}` : ""}
                </h1>
                <span className="bg-purple-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  ยืนยันแล้ว
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-purple-300" /> มหาวิทยาลัยพะเยา
                {user.faculty ? ` • ${user.faculty}` : ""}
              </p>
            </div>
          </div>

          {/* Photo Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600">
                  รูปภาพทั้งหมด ({images.length} รูป)
                </span>
                <span className="text-[10px] text-purple-800 font-semibold">
                  แตะที่รูปเพื่อดูภาพใหญ่
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActivePhotoIdx(i)}
                    className={`relative w-16 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      i === activePhotoIdx
                        ? "border-purple-800 ring-2 ring-purple-800/30 scale-105 shadow-xs"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={formatImageUrl(imgUrl)}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-purple-900 text-white text-[8px] font-bold text-center py-0.5">
                        รูปหลัก
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details Section */}
          <div className="p-4 space-y-3.5">
            {/* Caption */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs mb-1">
                <Quote className="w-4 h-4 text-purple-800" />
                <span>แนะนำตัว</span>
              </div>
              {user.caption || user.bio ? (
                <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                  &ldquo;{user.caption || user.bio}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-slate-500 font-normal">
                  ไม่ได้ระบุข้อความแนะนำตัว
                </p>
              )}
            </div>

            {/* Faculty */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs mb-1">
                <GraduationCap className="w-4 h-4 text-purple-800" />
                <span>คณะที่ศึกษา</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900">
                {user.faculty && user.faculty !== "-" ? user.faculty : "มหาวิทยาลัยพะเยา"}
              </p>
            </div>

            {/* Height & MBTI */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs mb-1">
                  <Ruler className="w-4 h-4 text-purple-800" />
                  <span>ส่วนสูง</span>
                </div>
                {user.height && user.height > 0 ? (
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">{user.height} ซม.</p>
                ) : (
                  <p className="text-xs text-slate-500 font-normal">ไม่ได้ระบุ</p>
                )}
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs mb-1">
                  <Brain className="w-4 h-4 text-purple-800" />
                  <span>บุคลิกภาพ (MBTI)</span>
                </div>
                {user.mbti && user.mbti !== "-" ? (
                  <div className="inline-block px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs">
                    {user.mbti}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-normal">ไม่ได้ระบุ</p>
                )}
              </div>
            </div>

            {/* Hobbies */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs mb-1">
                <Palette className="w-4 h-4 text-amber-700" />
                <span>งานอดิเรก</span>
              </div>
              {hobbiesList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {hobbiesList.map((hobby, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white border border-slate-200 text-slate-800 px-2.5 py-0.5 rounded-md font-medium"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-normal">ไม่ได้ระบุงานอดิเรก</p>
              )}
            </div>

            {/* Gender & Preference */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-medium mb-0.5">เพศ</span>
                <span className="font-bold text-slate-900">{user.gender || "-"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block font-medium mb-0.5">สนใจ</span>
                <span className="font-bold text-slate-900">{user.preference || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          {actionType === "chat" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              คุยกับ {user.name} ต่อเลย
            </button>
          ) : actionType === "swipe" ? (
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAction?.("left");
                }}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                ข้าม
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAction?.("right");
                }}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white" />
                ถูกใจ
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
