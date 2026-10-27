// frontend/app/profile/page.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import {
  User,
  Settings,
  Edit3,
  Image as ImageIcon,
  LogOut,
  Loader2,
  X,
  Save,
  Bell,
  Heart,
  MessageCircle,
  Volume2,
  Smartphone,
  Plus,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";

const calculateAgeFromProfile = (profile) => {
  if (profile?.birth_date) {
    const birth = new Date(profile.birth_date);
    if (!isNaN(birth.getTime()) && birth.getFullYear() > 1900) {
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age > 0) return age;
    }
  }
  if (profile?.age && profile.age > 0) return profile.age;
  return "";
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [activeModal, setActiveModal] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    birth_date: "2004-01-01",
    faculty: "",
    gender: "ชาย",
    preference: "หญิง",
    caption: "",
    hobbies: "",
    mbti: "",
  });

  const [photoSlots, setPhotoSlots] = useState(() => Array(9).fill(null));
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [targetSlotIndex, setTargetSlotIndex] = useState(null);
  const fileInputRef = useRef(null);
  const touchOriginRef = useRef(null);
  const isDraggingTouchRef = useRef(false);

  const [appSettings, setAppSettings] = useState({
    notifyMatch: true,
    notifyMessage: true,
    soundAlert: true,
  });

  const [pushStatus, setPushStatus] = useState("default");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("upmatch_settings");
      if (saved) {
        setAppSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
      if (typeof window !== "undefined" && "Notification" in window) {
        setPushStatus(Notification.permission);
      }
    } catch (e) {}
  }, []);

  const handleEnablePush = async () => {
    window.dispatchEvent(new Event("upmatch_request_push"));
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const p = await Notification.requestPermission();
        setPushStatus(p);
      } catch (err) {}
    }
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem("upmatch_settings", JSON.stringify(appSettings));
      window.dispatchEvent(new CustomEvent("upmatch_settings_updated", { detail: appSettings }));
      setActiveModal(null);
    } catch (e) {
      setActiveModal(null);
    }
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
    return "";
  };

  const syncSlotsWithProfile = (p) => {
    const prof = p || profile;
    const slots = Array(9).fill(null);
    if (prof?.images && Array.isArray(prof.images)) {
      prof.images.forEach((imgUrl, idx) => {
        if (idx < 9 && imgUrl) {
          slots[idx] = {
            id: `existing-${idx}-${imgUrl}`,
            type: "existing",
            url: imgUrl,
          };
        }
      });
    }
    setPhotoSlots(slots);
  };

  const fetchMyProfile = async () => {
    setLoading(true);
    try {
      const token = getCookie("up_match_token");
      const email = getCookie("upmatch_email");

      const res = await fetch(`${getApiBaseUrl()}/api/v1/me?email=${encodeURIComponent(email)}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const p = data.profile;
        setProfile(p);
        syncSlotsWithProfile(p);

        setEditForm({
          name: p.name || "",
          birth_date: p.birth_date ? p.birth_date.slice(0, 10) : "2004-01-01",
          faculty: p.faculty || "",
          gender: p.gender || "ชาย",
          preference: p.preference || "หญิง",
          caption: p.caption || "",
          hobbies: p.hobbies || "",
          mbti: p.mbti || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem("upmatch_settings");
    if (savedSettings) {
      try {
        setAppSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }
    fetchMyProfile();
  }, []);

  useEffect(() => {
    if (activeModal === "managePhotos") {
      syncSlotsWithProfile(profile);
    }
  }, [activeModal]);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      alert("กรุณาระบุชื่อของคุณ");
      return;
    }

    setSaving(true);
    try {
      const email = profile?.email || getCookie("upmatch_email");
      const data = new FormData();
      data.append("email", email);
      data.append("name", editForm.name);
      data.append("faculty", editForm.faculty);
      data.append("birth_date", editForm.birth_date);
      data.append("gender", editForm.gender);
      data.append("preference", editForm.preference);
      data.append("caption", editForm.caption);
      data.append("hobbies", editForm.hobbies);
      data.append("mbti", editForm.mbti);

      const res = await fetch(`${getApiBaseUrl()}/api/v1/profile`, {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("upmatch_feed_cache");
          const userEmail = email || profile?.email || "";
          if (userEmail) {
            sessionStorage.removeItem(`upmatch_feed_cache_${userEmail}`);
          }
        }
        await fetchMyProfile();
        setActiveModal(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSaving(false);
    }
  };

  const handleSlotClick = (index) => {
    if (isDraggingTouchRef.current) return;
    setTargetSlotIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPhotoSlots((prev) => {
      const next = [...prev];
      const fileList = Array.from(files);

      if (targetSlotIndex !== null) {
        const firstFile = fileList[0];
        const previewUrl = URL.createObjectURL(firstFile);
        next[targetSlotIndex] = {
          id: `new-${Date.now()}-${Math.random()}`,
          type: "new",
          file: firstFile,
          previewUrl: previewUrl,
        };

        if (fileList.length > 1) {
          let extraIdx = 0;
          for (let i = 0; i < 9 && extraIdx < fileList.length - 1; i++) {
            if (i !== targetSlotIndex && next[i] === null) {
              const extraFile = fileList[extraIdx + 1];
              next[i] = {
                id: `new-${Date.now()}-${extraIdx}-${Math.random()}`,
                type: "new",
                file: extraFile,
                previewUrl: URL.createObjectURL(extraFile),
              };
              extraIdx++;
            }
          }
        }
      } else {
        let fileIdx = 0;
        for (let i = 0; i < 9 && fileIdx < fileList.length; i++) {
          if (next[i] === null) {
            const file = fileList[fileIdx];
            next[i] = {
              id: `new-${Date.now()}-${fileIdx}-${Math.random()}`,
              type: "new",
              file: file,
              previewUrl: URL.createObjectURL(file),
            };
            fileIdx++;
          }
        }
      }

      const active = next.filter(Boolean);
      const compacted = Array(9).fill(null);
      active.forEach((item, idx) => {
        compacted[idx] = item;
      });
      return compacted;
    });

    setTargetSlotIndex(null);
  };

  const handleDeleteSlot = (index, e) => {
    e.stopPropagation();
    setPhotoSlots((prev) => {
      const active = prev.filter((item, idx) => item !== null && idx !== index);
      const compacted = Array(9).fill(null);
      active.forEach((item, idx) => {
        compacted[idx] = item;
      });
      return compacted;
    });
  };

  const reorderSlots = (fromIndex, toIndex) => {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;

    setPhotoSlots((prev) => {
      const active = prev.filter(Boolean);
      if (fromIndex >= active.length) return prev;

      const targetIdx = Math.min(toIndex, active.length - 1);
      if (fromIndex === targetIdx) return prev;

      const newActive = [...active];
      const [movedItem] = newActive.splice(fromIndex, 1);
      newActive.splice(targetIdx, 0, movedItem);

      const compacted = Array(9).fill(null);
      newActive.forEach((item, idx) => {
        compacted[idx] = item;
      });
      return compacted;
    });
  };

  const handleTouchStart = (index, e) => {
    if (!photoSlots[index]) return;
    const touch = e.touches[0];
    touchOriginRef.current = {
      index,
      startX: touch.clientX,
      startY: touch.clientY,
    };
    isDraggingTouchRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!touchOriginRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchOriginRef.current.startX);
    const dy = Math.abs(touch.clientY - touchOriginRef.current.startY);

    if (dx > 10 || dy > 10) {
      isDraggingTouchRef.current = true;
      setDraggedIndex(touchOriginRef.current.index);

      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      const slotCard = elem?.closest("[data-slot-idx]");
      if (slotCard) {
        const targetIdx = parseInt(slotCard.getAttribute("data-slot-idx"), 10);
        if (!isNaN(targetIdx) && targetIdx !== dragOverIndex) {
          setDragOverIndex(targetIdx);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (isDraggingTouchRef.current && touchOriginRef.current && dragOverIndex !== null) {
      reorderSlots(touchOriginRef.current.index, dragOverIndex);
    }
    setTimeout(() => {
      isDraggingTouchRef.current = false;
    }, 150);

    touchOriginRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSavePhotos = async () => {
    const activePhotos = photoSlots.filter(Boolean);
    if (activePhotos.length < 2) {
      alert("กรุณาเลือกรูปภาพอย่างน้อย 2 รูปครับ");
      return;
    }

    setSaving(true);
    try {
      const email = profile?.email || getCookie("upmatch_email");
      const data = new FormData();
      data.append("email", email);
      data.append("name", editForm.name || profile?.name || "");
      data.append("faculty", editForm.faculty || profile?.faculty || "");
      data.append("birth_date", editForm.birth_date || profile?.birth_date || "2004-01-01");
      data.append("gender", editForm.gender || profile?.gender || "ชาย");
      data.append("preference", editForm.preference || profile?.preference || "หญิง");
      data.append("caption", editForm.caption || profile?.caption || "");
      data.append("hobbies", editForm.hobbies || profile?.hobbies || "");
      data.append("mbti", editForm.mbti || profile?.mbti || "");

      const manifest = [];
      activePhotos.forEach((item) => {
        if (item.type === "existing") {
          manifest.push({
            type: "existing",
            url: item.url,
          });
        } else if (item.type === "new" && item.file) {
          manifest.push({
            type: "new",
          });
          data.append("images", item.file);
        }
      });

      data.append("photos_manifest", JSON.stringify(manifest));

      const res = await fetch(`${getApiBaseUrl()}/api/v1/profile`, {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("upmatch_feed_cache");
          const userEmail = email || profile?.email || "";
          if (userEmail) {
            sessionStorage.removeItem(`upmatch_feed_cache_${userEmail}`);
          }
        }
        await fetchMyProfile();
        setActiveModal(null);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "อัปโหลดรูปภาพไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "upmatch_email=; path=/; max-age=0";
    document.cookie = "up_match_token=; path=/; max-age=0";
    router.push("/");
  };

  const displayAge = calculateAgeFromProfile(profile);

  return (
    <div className="h-dvh max-h-screen bg-transparent text-slate-800 flex flex-col overflow-hidden relative z-10">
      <div className="shrink-0 z-30">
        <Navbar />
      </div>
      <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar max-w-md mx-auto w-full px-4 py-4 sm:py-6 page-bottom-padding">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-800 mb-2" />
            <p className="text-xs text-slate-600 font-semibold">กำลังโหลดโปรไฟล์...</p>
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img
                src={formatImageUrl(profile.image)}
                alt="My Profile"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-slate-200 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setActiveModal("managePhotos")}
                title="เปลี่ยนรูปโปรไฟล์"
                className="absolute bottom-0 right-0 bg-purple-900 hover:bg-purple-950 text-white p-2 rounded-full shadow-xs transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <h1 className="mt-3 text-xl sm:text-2xl font-black text-slate-900">
              {profile.name}
              {displayAge ? `, ${displayAge}` : ""}
            </h1>

            {profile.caption && (
              <p className="text-xs text-slate-600 mt-1 text-center max-w-xs font-normal">
                "{profile.caption}"
              </p>
            )}

            <p className="text-xs text-purple-900 font-semibold bg-purple-100 px-3 py-0.5 rounded-full mt-2 border border-purple-200">
              ยืนยันอีเมล @up.ac.th แล้ว
            </p>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-xs font-medium">
            ไม่พบข้อมูลโปรไฟล์ กรุณาล็อกอินใหม่
          </div>
        )}

        {/* Action Menu List */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setActiveModal("editInfo")}
            className="w-full flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg text-purple-900">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-xs sm:text-sm text-slate-800 block">แก้ไขข้อมูลส่วนตัว</span>
                <span className="text-[11px] text-slate-400">ชื่อ, วันเกิด, คณะ, แคปชั่น, MBTI</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("managePhotos")}
            className="w-full flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg text-purple-900">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-xs sm:text-sm text-slate-800 block">จัดการรูปภาพ (9 ช่อง)</span>
                <span className="text-[11px] text-slate-400">ดูรูปปัจจุบัน หรืออัปโหลดรูปโปรไฟล์ใหม่</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("settings")}
            className="w-full flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
                <Settings className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-xs sm:text-sm text-slate-800 block">ตั้งค่าแอปพลิเคชัน</span>
                <span className="text-[11px] text-slate-400">การแจ้งเตือนและระบบเสียง</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("disclaimer")}
            className="w-full flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-900">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-xs sm:text-sm text-slate-800 block">ข้อกำหนดและข้อสงวนสิทธิ์ (Disclaimer)</span>
                <span className="text-[11px] text-slate-400">วัตถุประสงค์เพื่อการศึกษา และแนวทางความปลอดภัย</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3.5 bg-white border border-rose-200 rounded-xl shadow-2xs hover:bg-rose-50 transition mt-5 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-rose-100 p-2 rounded-lg text-rose-700">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-rose-700">ออกจากระบบ</span>
            </div>
          </button>
        </div>
      </main>

      {/* MODAL 1: Edit Profile Info */}
      {activeModal === "editInfo" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xs border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-900" /> แก้ไขข้อมูลส่วนตัว
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อเล่น</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none focus:border-purple-800 focus:ring-1 focus:ring-purple-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วันเดือนปีเกิด (ค.ศ.)</label>
                <input
                  type="date"
                  value={editForm.birth_date}
                  onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none focus:border-purple-800 focus:ring-1 focus:ring-purple-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">คณะ</label>
                <input
                  type="text"
                  placeholder="เช่น ICT, วิศวกรรมศาสตร์, พยาบาลศาสตร์"
                  value={editForm.faculty}
                  onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none focus:border-purple-800 focus:ring-1 focus:ring-purple-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เพศของคุณ</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                  >
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="LGBTQ+">LGBTQ+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">สนใจแมตช์กับ</label>
                  <select
                    value={editForm.preference}
                    onChange={(e) => setEditForm({ ...editForm, preference: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                  >
                    <option value="หญิง">ผู้หญิง</option>
                    <option value="ชาย">ผู้ชาย</option>
                    <option value="ทั้งหมด">ทุกคน</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">แคปชั่นแนะนำตัว</label>
                <input
                  type="text"
                  placeholder="เช่น หาเพื่อนกินหมูกระทะ..."
                  value={editForm.caption}
                  onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none focus:border-purple-800 focus:ring-1 focus:ring-purple-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">งานอดิเรก</label>
                  <input
                    type="text"
                    placeholder="เช่น ฟังเพลง, เล่นบอร์ดเกม"
                    value={editForm.hobbies}
                    onChange={(e) => setEditForm({ ...editForm, hobbies: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">MBTI</label>
                  <input
                    type="text"
                    placeholder="เช่น INFP, ENFP"
                    value={editForm.mbti}
                    onChange={(e) => setEditForm({ ...editForm, mbti: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Manage 9 Photos */}
      {activeModal === "managePhotos" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md sm:max-w-lg w-full p-4 sm:p-5 shadow-xs border border-slate-200 max-h-[94vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    จัดการรูปภาพโปรไฟล์ (9 ช่อง)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    แตะที่รูปเพื่อเปลี่ยนรูป • ลากเพื่อสลับตำแหน่ง
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mb-2.5 text-xs text-slate-700 shrink-0">
              <p className="text-[11px] leading-tight font-medium">
                <strong>ช่องที่ 1:</strong> จะเป็นรูปโปรไฟล์หลักที่เพื่อนเห็นก่อนเสมอ
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 mb-2.5">
              <div className="grid grid-cols-3 gap-2">
                {photoSlots.map((slot, idx) => {
                  const isFilled = slot !== null;
                  const isMain = idx === 0;
                  const isDragging = draggedIndex === idx;
                  const isDragOver = dragOverIndex === idx;

                  return (
                    <div
                      key={slot?.id || `empty-slot-${idx}`}
                      data-slot-idx={idx}
                      draggable={isFilled}
                      onDragStart={(e) => {
                        if (!isFilled) return;
                        e.dataTransfer.setData("text/plain", String(idx));
                        setDraggedIndex(idx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverIndex !== idx) setDragOverIndex(idx);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragOverIndex(idx);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        reorderSlots(draggedIndex, idx);
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      onTouchStart={(e) => isFilled && handleTouchStart(idx, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onClick={() => handleSlotClick(idx)}
                      className={`group relative aspect-[4/5] rounded-xl select-none transition-all duration-150 touch-none ${
                        isFilled
                          ? `cursor-grab active:cursor-grabbing overflow-hidden border-2 shadow-2xs ${
                              isDragging
                                ? "opacity-30 scale-95 border-purple-800"
                                : isDragOver
                                ? "border-purple-900 ring-2 ring-purple-900/30 scale-105 z-20"
                                : "border-slate-200 hover:border-slate-400"
                            }`
                          : `cursor-pointer border-2 border-dashed flex flex-col items-center justify-center ${
                              isDragOver
                                ? "border-purple-800 bg-purple-50 ring-2 ring-purple-800/30 scale-105 z-20"
                                : "border-slate-300 hover:border-purple-800 bg-slate-50"
                            }`
                      }`}
                    >
                      <div
                        className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isFilled
                            ? "bg-black/60 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {isFilled ? (
                        <>
                          {isMain && (
                            <div className="absolute top-1.5 left-7 z-10 bg-purple-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                              รูปหลัก
                            </div>
                          )}

                          <img
                            src={
                              slot.type === "existing"
                                ? formatImageUrl(slot.url)
                                : slot.previewUrl
                            }
                            alt={`Profile slot ${idx + 1}`}
                            className="w-full h-full object-cover pointer-events-none"
                          />

                          <button
                            type="button"
                            onClick={(e) => handleDeleteSlot(idx, e)}
                            title="ลบรูปภาพนี้"
                            className="absolute bottom-1.5 right-1.5 z-20 w-6 h-6 bg-white text-rose-600 rounded-full flex items-center justify-center shadow-xs border border-slate-200 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>

                          <div className="absolute bottom-1.5 left-1.5 z-10 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>แทนที่</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <span className="text-[10px] font-medium text-slate-500 mt-1">
                            เพิ่มรูป
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="pt-2 border-t border-slate-200 shrink-0">
              <div className="flex items-center justify-between text-xs mb-3 px-1">
                <span className="text-slate-600 font-medium">
                  รูปทั้งหมด:{" "}
                  <strong className="text-slate-900">
                    {photoSlots.filter(Boolean).length}/9 รูป
                  </strong>
                </span>
                {photoSlots.filter(Boolean).length < 2 ? (
                  <span className="text-rose-700 font-semibold text-[11px]">
                    ต้องการอย่างน้อย 2 รูป
                  </span>
                ) : (
                  <span className="text-purple-900 font-semibold text-[11px]">
                    รูปภาพพร้อมบันทึก
                  </span>
                )}
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="button"
                  onClick={handleSavePhotos}
                  disabled={saving || photoSlots.filter(Boolean).length < 2}
                  className="w-1/2 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  อัปเดตรูปภาพ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: App Settings */}
      {activeModal === "settings" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" /> ตั้งค่าแอปพลิเคชัน
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <span className="text-[11px] font-bold text-purple-900 block">บัญชีมหาวิทยาลัยพะเยาที่เชื่อมต่อ</span>
                <span className="font-semibold text-slate-900">{profile?.email || getCookie("upmatch_email")}</span>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                    <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">แจ้งเตือนเมื่อใจตรงกัน (Match)</span>
                    <span className="text-[10px] text-slate-400">รับการแจ้งเตือนทันทีเมื่อมีคนใจตรงกันกับคุณ</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.notifyMatch}
                  onChange={(e) => setAppSettings({ ...appSettings, notifyMatch: e.target.checked })}
                  className="w-4 h-4 accent-purple-900 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-800 shrink-0">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">แจ้งเตือนข้อความแชทใหม่</span>
                    <span className="text-[10px] text-slate-400">รับการแจ้งเตือนเมื่อมีเพื่อนทักข้อความเข้ามา</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.notifyMessage}
                  onChange={(e) => setAppSettings({ ...appSettings, notifyMessage: e.target.checked })}
                  className="w-4 h-4 accent-purple-900 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-900 shrink-0">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">เสียงแจ้งเตือน (Sound Alert)</span>
                    <span className="text-[10px] text-slate-400">เล่นเสียงแจ้งเตือนเมื่อมี Match หรือข้อความใหม่</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.soundAlert}
                  onChange={(e) => setAppSettings({ ...appSettings, soundAlert: e.target.checked })}
                  className="w-4 h-4 accent-purple-900 rounded cursor-pointer"
                />
              </label>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-800 shrink-0" />
                    <span className="font-bold text-slate-900 text-xs">แจ้งเตือนบนมือถือ / แท็บเล็ต</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      pushStatus === "granted"
                        ? "bg-slate-200 text-slate-700 cursor-default"
                        : "bg-purple-900 hover:bg-purple-950 text-white active:scale-95"
                    }`}
                  >
                    {pushStatus === "granted" ? "เปิดแล้ว ✓" : "กดเปิดแจ้งเตือน"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  รับการแจ้งเตือนบนแถบ Notification Banner ของระบบ
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-1/2 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold shadow-xs cursor-pointer"
                >
                  บันทึกตั้งค่า
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Disclaimer & Safety Guidelines */}
      {activeModal === "disclaimer" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xs border border-slate-200 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    ข้อกำหนดและข้อจำกัดความรับผิดชอบ
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">UP Match Independent Student Project</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                <h3 className="font-bold text-amber-950 flex items-center gap-1.5">
                  1. การไม่มีความเกี่ยวข้องกับมหาวิทยาลัย (No Official Affiliation)
                </h3>
                <p className="text-[11px] text-amber-900 leading-normal">
                  เว็บไซต์ UP Match เป็นโครงงานอิสระที่พัฒนาขึ้นโดยนิสิต <strong>ไม่มีความเกี่ยวข้อง ไม่ได้รับการสนับสนุน และไม่ได้ดำเนินการอย่างเป็นทางการโดยมหาวิทยาลัยพะเยา (University of Phayao)</strong> ชื่อมหาวิทยาลัยหรือคำเรียกถูกนำมาใช้เพื่อระบุกลุ่มเป้าหมายเชิงพื้นที่เท่านั้น
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900">
                  2. วัตถุประสงค์ของโครงการ (Educational Purpose)
                </h3>
                <p className="text-slate-600">
                  โครงการนี้จัดทำขึ้นเพื่อการศึกษา ค้นคว้า และพัฒนาทักษะด้าน Software Engineering และการพัฒนาเว็บแอปพลิเคชัน รวมถึงมุ่งหวังเป็นพื้นที่สื่อกลางช่วยให้นิสิตในมหาวิทยาลัยได้สร้างมิตรภาพ แลกเปลี่ยนมุมมอง และทำความรู้จักเพื่อนใหม่เชิงสร้างสรรค์
                </p>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900">
                  3. ข้อจำกัดความรับผิดชอบ (Limitation of Liability)
                </h3>
                <p className="text-slate-600">
                  ผู้พัฒนาไม่มีส่วนเกี่ยวข้องและไม่รับผิดชอบต่อพฤติกรรม ข้อความ การสนทนา การนัดหมาย หรือความเสียหายใดๆ ทั้งทางตรงและทางอ้อมที่เกิดขึ้นระหว่างผู้ใช้งาน ผู้ใช้บริการพึงใช้วิจารณญาณส่วนบุคคลในการตัดสินใจและติดต่อสื่อสาร
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h3 className="font-bold text-slate-900">
                  4. คำแนะนำเพื่อความปลอดภัย (Safety & Community Rules)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                  <li><strong>ห้ามโอนเงิน</strong> หรือให้ข้อมูลทางการเงิน เลขบัญชี หรือรหัสผ่านแก่ผู้อื่นโดยเด็ดขาด</li>
                  <li>ระมัดระวังการเปิดเผยข้อมูลส่วนบุคคลหรือสถานที่พักอาศัยแก่คนแปลกหน้า</li>
                  <li>หากมีการนัดพบ ควรนัดพบในเวลากลางวันและสถานที่สาธารณะที่มีผู้คนสัญจร</li>
                  <li>หากพบบัญชีน่าสงสัย หลอกลวง หรือคุกคาม สามารถใช้ปุ่มรายงาน (Report) หรือบล็อก (Block) ได้ทันที</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900">
                  5. ข้อมูลส่วนบุคคล (Data Privacy)
                </h3>
                <p className="text-[11px] text-slate-500">
                  อีเมลสถาบันใช้สำหรับการยืนยันรหัส OTP เพื่อยืนยันสถานะนิสิตเท่านั้น ระบบไม่มีนโยบายจำหน่าย ส่งต่อ หรือเปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลภายนอก
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-xs cursor-pointer transition active:scale-98"
              >
                รับทราบและเข้าใจข้อตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}