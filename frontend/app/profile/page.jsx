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
  Check,
  Sparkles,
  Bell,
  Heart,
  MessageCircle,
  Volume2,
  Smartphone,
  Plus,
  RefreshCw,
  GripVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";

// ฟังก์ชันคำนวณอายุจากวันเกิด (รองรับทั้งค่า age และ birth_date จาก Database)
const calculateAgeFromProfile = (profile) => {
  if (profile?. birth_date) {
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

  // Modal States: null | "editInfo" | "managePhotos" | "settings"
  const [activeModal, setActiveModal] = useState(null);

  // State สำหรับแก้ไขข้อมูลส่วนตัว
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

  // State สำหรับจัดการรูปภาพ 9 ช่องแบบ Tinder
  const [photoSlots, setPhotoSlots] = useState(() => Array(9).fill(null));
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [targetSlotIndex, setTargetSlotIndex] = useState(null);
  const fileInputRef = useRef(null);
  const touchOriginRef = useRef(null);
  const isDraggingTouchRef = useRef(false);

  // State สำหรับตั้งค่าแอปพลิเคชัน
  const [appSettings, setAppSettings] = useState({
    notifyMatch: true,
    notifyMessage: true,
    soundAlert: true,
  });

  const [pushStatus, setPushStatus] = useState("default");

  // โหลดการตั้งค่าจาก localStorage ตอนเปิดหน้า
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
        if (p === "granted") {
          setToastMsg("เปิดรับการแจ้งเตือนบนมือถือ/ไอแพดเรียบร้อยแล้ว 🎉");
        }
      } catch (err) {}
    }
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem("upmatch_settings", JSON.stringify(appSettings));
      window.dispatchEvent(new CustomEvent("upmatch_settings_updated", { detail: appSettings }));
      setToastMsg("บันทึกการตั้งค่าเรียบร้อยแล้ว ✨");
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

  // ซิงค์รูปภาพจาก Profile ไปยัง 9 ช่อง
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

      // ลองเรียกผ่าน Backend หรือ Proxy พร้อมส่ง email
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

        // เตรียมข้อมูลเริ่มต้นสำหรับฟอร์มแก้ไข
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
      } else {
        console.error("Failed to fetch profile:", res.status);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // โหลดการตั้งค่าแอปจาก localStorage (ถ้ามี)
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

  // บันทึกการแก้ไขข้อมูลส่วนตัวลง Database
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
        alert("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว!");
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

  // คลิกช่องเพื่อเปลี่ยนรูป (กรณีมีรูปอยู่แล้ว) หรือเพิ่มรูปใหม่ (กรณีช่องว่าง)
  const handleSlotClick = (index) => {
    if (isDraggingTouchRef.current) return;
    setTargetSlotIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // จัดการเมื่อเลือกไฟล์รูปภาพ
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPhotoSlots((prev) => {
      const next = [...prev];
      const fileList = Array.from(files);

      if (targetSlotIndex !== null) {
        // หากคลิกที่ช่องใดช่องหนึ่ง ให้แทนที่หรือใส่ที่ช่องนั้น
        const firstFile = fileList[0];
        const previewUrl = URL.createObjectURL(firstFile);
        next[targetSlotIndex] = {
          id: `new-${Date.now()}-${Math.random()}`,
          type: "new",
          file: firstFile,
          previewUrl: previewUrl,
        };

        // หากเลือกมาหลายรูป ให้เติมลงในช่องว่างถัดไป
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
        // กรณีไม่ได้เจาะจง ให้เติมลงช่องว่างแรก
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

      // บีบอัดรูปภาพให้อยู่ชิดหน้าเสมอตามสไตล์ Tinder
      const active = next.filter(Boolean);
      const compacted = Array(9).fill(null);
      active.forEach((item, idx) => {
        compacted[idx] = item;
      });
      return compacted;
    });

    setTargetSlotIndex(null);
  };

  // ลบรูปภาพออกจากช่อง
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

  // สลับ/แซกตำแหน่งรูปภาพตามการลาก (Drag & Drop Reorder)
  const reorderSlots = (fromIndex, toIndex) => {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;

    setPhotoSlots((prev) => {
      const active = prev.filter(Boolean);
      if (fromIndex >= active.length) return prev;

      // ถ้าเป้าหมายเกินจำนวนรูปที่มี ให้เลื่อนไปตำแหน่งสุดท้ายของรูปที่มี
      const targetIdx = Math.min(toIndex, active.length - 1);
      if (fromIndex === targetIdx) return prev;

      const newActive = [...active];
      const [movedItem] = newActive.splice(fromIndex, 1);
      newActive.splice(targetIdx, 0, movedItem); // แซกตรงตำแหน่งเป้าหมาย

      const compacted = Array(9).fill(null);
      newActive.forEach((item, idx) => {
        compacted[idx] = item;
      });
      return compacted;
    });
  };

  // Handlers สำหรับ Touch บน Mobile/iPad
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

  // บันทึกรูปภาพ 9 ช่องลง Database
  const handleSavePhotos = async () => {
    const activePhotos = photoSlots.filter(Boolean);
    if (activePhotos.length < 2) {
      alert("กรุณาเลือกรูปภาพอย่างน้อย 2 รูปครับ (รูปแรกจะเป็นรูปโปรไฟล์หลัก)");
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

      // สร้าง manifest ตามลำดับ slot
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
        alert("อัปเดตรูปภาพโปรไฟล์เรียบร้อยแล้ว!");
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
    <div className="h-dvh max-h-screen bg-transparent text-slate-800 flex flex-col overflow-hidden">
      <div className="shrink-0 z-30">
        <Navbar />
      </div>
      <main className="flex-1 min-h-0 overflow-y-auto max-w-md mx-auto w-full px-4 py-4 sm:py-8 page-bottom-padding">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
            <p className="text-sm text-purple-500 font-bold">กำลังโหลดโปรไฟล์...</p>
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <img
                src={formatImageUrl(profile.image)}
                alt="My Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg shadow-purple-200"
              />
              <button
                type="button"
                onClick={() => setActiveModal("managePhotos")}
                title="เปลี่ยนรูปโปรไฟล์"
                className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-full shadow-md hover:scale-110 transition cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* ✅ แสดงชื่อและอายุที่คำนวณจากวันเกิดจริง */}
            <h1 className="mt-4 text-2xl font-black text-slate-800">
              {profile.name}
              {displayAge ? `, ${displayAge}` : ""}
            </h1>

            {profile.caption && (
              <p className="text-xs text-slate-500 mt-1 text-center max-w-xs">
                "{profile.caption}"
              </p>
            )}

            <p className="text-sm text-purple-600 font-bold bg-purple-100/50 px-3 py-1 rounded-full mt-2">
              ✓ ยืนยัน @up.ac.th แล้ว
            </p>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm font-medium">
            ไม่พบข้อมูลโปรไฟล์ กรุณาล็อกอินใหม่
          </div>
        )}

        {/* ปุ่มเมนูจัดการโปรไฟล์ */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setActiveModal("editInfo")}
            className="w-full flex items-center justify-between p-4 bg-white border border-purple-100 rounded-2xl shadow-sm hover:bg-purple-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
                <User className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm text-slate-700 block">แก้ไขข้อมูลส่วนตัว</span>
                <span className="text-[11px] text-slate-400">ชื่อ, วันเกิด, คณะ, แคปชั่น, MBTI</span>
              </div>
            </div>
            <span className="text-slate-300">➔</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("managePhotos")}
            className="w-full flex items-center justify-between p-4 bg-white border border-purple-100 rounded-2xl shadow-sm hover:bg-purple-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-pink-100 p-2 rounded-xl text-pink-600">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm text-slate-700 block">จัดการรูปภาพ</span>
                <span className="text-[11px] text-slate-400">ดูรูปปัจจุบัน หรืออัปโหลดรูปโปรไฟล์ใหม่</span>
              </div>
            </div>
            <span className="text-slate-300">➔</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal("settings")}
            className="w-full flex items-center justify-between p-4 bg-white border border-purple-100 rounded-2xl shadow-sm hover:bg-purple-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                <Settings className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm text-slate-700 block">ตั้งค่าแอปพลิเคชัน</span>
                <span className="text-[11px] text-slate-400">การแสดงระยะทาง GPS, การแจ้งเตือน</span>
              </div>
            </div>
            <span className="text-slate-300">➔</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm hover:bg-rose-100 transition mt-6 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-rose-200/50 p-2 rounded-xl text-rose-600">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-rose-600">ออกจากระบบ</span>
            </div>
          </button>
        </div>
      </main>

      {/* ==================== MODAL 1: แก้ไขข้อมูลส่วนตัว ==================== */}
      {activeModal === "editInfo" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" /> แก้ไขข้อมูลส่วนตัว
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ชื่อเล่น</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-purple-100 bg-purple-50/30 outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">วันเดือนปีเกิด (ค.ศ.)</label>
                <input
                  type="date"
                  value={editForm.birth_date}
                  onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-purple-100 bg-purple-50/30 outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">คณะ</label>
                <input
                  type="text"
                  placeholder="เช่น ICT, วิศวกรรมศาสตร์, พยาบาลศาสตร์"
                  value={editForm.faculty}
                  onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-purple-100 bg-purple-50/30 outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">เพศของคุณ</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-purple-100 bg-purple-50/30 outline-none"
                  >
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="LGBTQ+">LGBTQ+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">สนใจแมตช์กับ</label>
                  <select
                    value={editForm.preference}
                    onChange={(e) => setEditForm({ ...editForm, preference: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-purple-100 bg-purple-50/30 outline-none"
                  >
                    <option value="หญิง">ผู้หญิง</option>
                    <option value="ชาย">ผู้ชาย</option>
                    <option value="ทั้งหมด">ทุกคน</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">แคปชั่นแนะนำตัว</label>
                <input
                  type="text"
                  placeholder="เช่น โสดโปรดจีบ..."
                  value={editForm.caption}
                  onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-purple-100 bg-purple-50/30 outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">งานอดิเรก</label>
                  <input
                    type="text"
                    placeholder="เช่น ฟังเพลง, เล่นเกม"
                    value={editForm.hobbies}
                    onChange={(e) => setEditForm({ ...editForm, hobbies: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-purple-100 bg-purple-50/30 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">MBTI</label>
                  <input
                    type="text"
                    placeholder="เช่น INFP, ENFP"
                    value={editForm.mbti}
                    onChange={(e) => setEditForm({ ...editForm, mbti: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-purple-100 bg-purple-50/30 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold shadow-lg shadow-purple-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: จัดการรูปภาพ (9 ช่องแบบ Tinder) ==================== */}
      {activeModal === "managePhotos" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md sm:max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-purple-100 max-h-[94vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md shadow-pink-200">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800">
                    จัดการรูปภาพโปรไฟล์ (9 ช่อง)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    แตะที่รูปเพื่อเปลี่ยนรูป • ลากเพื่อสลับตำแหน่ง • กด ✕ เพื่อลบ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Tips */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 via-pink-50/50 to-purple-50 p-2.5 rounded-2xl border border-purple-100/70 mb-2.5 text-xs text-purple-800 shrink-0">
              <span className="text-sm shrink-0">💡</span>
              <p className="text-[11px] leading-tight">
                <strong>ช่องที่ 1 (รูปหลัก):</strong> ลากรูปโปรไฟล์ที่คุณชอบที่สุดมาไว้ช่องแรก จะแสดงให้เพื่อนเห็นคนแรก
              </p>
            </div>

            {/* Grid 9 ช่อง (3x3 Tinder Style) */}
            <div className="flex-1 overflow-y-auto pr-1 mb-2.5 [scrollbar-width:thin] [scrollbar-color:#f1d6fa_transparent]">
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
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
                      className={`group relative aspect-[4/5] rounded-2xl select-none transition-all duration-200 touch-none ${
                        isFilled
                          ? `cursor-grab active:cursor-grabbing overflow-hidden border-2 shadow-xs ${
                              isDragging
                                ? "opacity-30 scale-95 border-purple-400 ring-2 ring-purple-300"
                                : isDragOver
                                ? "border-pink-500 ring-4 ring-pink-400/40 scale-105 z-20 shadow-xl"
                                : "border-slate-200/90 hover:border-pink-400 hover:shadow-md"
                            }`
                          : `cursor-pointer border-2 border-dashed flex flex-col items-center justify-center ${
                              isDragOver
                                ? "border-pink-500 bg-pink-100/50 ring-4 ring-pink-400/30 scale-105 z-20"
                                : "border-slate-300 hover:border-pink-400 bg-slate-50/70 hover:bg-pink-50/25"
                            }`
                      }`}
                    >
                      {/* หมายเลขช่อง 1-9 */}
                      <div
                        className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isFilled
                            ? "bg-black/60 text-white backdrop-blur-xs shadow-xs"
                            : "bg-slate-200/80 text-slate-500"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {isFilled ? (
                        <>
                          {/* ป้ายรูปหลักสำหรับช่องที่ 1 */}
                          {isMain && (
                            <div className="absolute top-1.5 left-7 z-10 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                              ⭐ รูปหลัก
                            </div>
                          )}

                          {/* ภาพโปรไฟล์ */}
                          <img
                            src={
                              slot.type === "existing"
                                ? formatImageUrl(slot.url)
                                : slot.previewUrl
                            }
                            alt={`Profile slot ${idx + 1}`}
                            className="w-full h-full object-cover pointer-events-none"
                          />

                          {/* ปุ่มลบรูปภาพ (X แบบทินเดอร์) */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSlot(idx, e)}
                            title="ลบรูปภาพนี้"
                            className="absolute bottom-1.5 right-1.5 z-20 w-7 h-7 bg-white text-rose-500 rounded-full flex items-center justify-center shadow-md border border-rose-100 hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>

                          {/* ปุ่มคำแนะนำแตะเพื่อแทนที่ */}
                          <div className="absolute bottom-1.5 left-1.5 z-10 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>แทนที่</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* ช่องว่างสำหรับเพิ่มรูปใหม่ */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-200 group-hover:scale-110 transition-transform">
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-pink-500 mt-1 transition-colors">
                            เพิ่มรูป
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hidden File Input สำหรับเลือกรูปเดี่ยวหรือกลุ่ม */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Footer Summary & Buttons */}
            <div className="pt-2 border-t border-purple-50 shrink-0">
              <div className="flex items-center justify-between text-xs mb-3 px-1">
                <span className="text-slate-500 font-medium">
                  รูปทั้งหมด:{" "}
                  <strong
                    className={
                      photoSlots.filter(Boolean).length >= 2
                        ? "text-purple-600"
                        : "text-rose-500"
                    }
                  >
                    {photoSlots.filter(Boolean).length}/9 รูป
                  </strong>
                </span>
                {photoSlots.filter(Boolean).length < 2 ? (
                  <span className="text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-full text-[11px] border border-rose-100">
                    ⚠️ ต้องการอย่างน้อย 2 รูป
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full text-[11px] border border-emerald-100">
                    ✓ รูปภาพพร้อมบันทึก
                  </span>
                )}
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="button"
                  onClick={handleSavePhotos}
                  disabled={saving || photoSlots.filter(Boolean).length < 2}
                  className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-purple-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  อัปเดตรูปภาพ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: ตั้งค่าแอปพลิเคชัน ==================== */}
      {activeModal === "settings" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" /> ตั้งค่าแอปพลิเคชัน
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
                <span className="text-[11px] font-bold text-purple-600 block">บัญชีมหาวิทยาลัยพะเยาที่เชื่อมต่อ</span>
                <span className="font-bold text-slate-800">{profile?.email || getCookie("upmatch_email")}</span>
              </div>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-pink-200 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                    <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block text-xs sm:text-sm">แจ้งเตือนเมื่อใจตรงกัน (Match)</span>
                    <span className="text-[11px] text-slate-400">รับการแจ้งเตือนทันทีเมื่อมีคนใจตรงกันกับคุณ</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.notifyMatch}
                  onChange={(e) => setAppSettings({ ...appSettings, notifyMatch: e.target.checked })}
                  className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-purple-200 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block text-xs sm:text-sm">แจ้งเตือนข้อความแชทใหม่</span>
                    <span className="text-[11px] text-slate-400">รับการแจ้งเตือนเมื่อมีเพื่อนทักข้อความเข้ามา</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.notifyMessage}
                  onChange={(e) => setAppSettings({ ...appSettings, notifyMessage: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-purple-200 transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block text-xs sm:text-sm">เสียงแจ้งเตือน (Sound Alert)</span>
                    <span className="text-[11px] text-slate-400">เล่นเสียงแจ้งเตือนเมื่อมี Match หรือข้อความใหม่</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={appSettings.soundAlert}
                  onChange={(e) => setAppSettings({ ...appSettings, soundAlert: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </label>

              {/* ปุ่มเปิดแจ้งเตือนบนมือถือ + คำแนะนำสำหรับ iPhone / iPad */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50/60 to-purple-50 border border-purple-100/90 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">แจ้งเตือนบนมือถือ / ไอแพด</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                      pushStatus === "granted"
                        ? "bg-emerald-500 text-white cursor-default"
                        : "bg-purple-600 hover:bg-purple-700 text-white active:scale-95"
                    }`}
                  >
                    {pushStatus === "granted" ? "เปิดแล้ว ✓" : "กดเปิดแจ้งเตือน"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  รับการแจ้งเตือนบนแถบแจ้งเตือนด้านบน (Notification Banner)
                </p>
                <div className="mt-2.5 pt-2 border-t border-purple-200/60 text-[11px] text-purple-950 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-purple-100">
                  <span className="font-bold text-purple-700 block mb-0.5">📱 วิธีให้แจ้งเตือนตอนพับหน้าจอ (iPhone / iPad / Android):</span>
                  <p className="text-slate-600">
                    บน Safari ให้แตะปุ่มแชร์ <span className="font-bold text-purple-600">⎋</span> แล้วเลือก <span className="font-bold text-pink-600">"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</span> จะได้รับแจ้งเตือนบนหน้าจอล็อกตลอดเวลาแม้พับจออยู่!
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-1/2 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold shadow-lg shadow-purple-200 cursor-pointer"
                >
                  บันทึกตั้งค่า
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}