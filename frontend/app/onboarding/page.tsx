// frontend/app/onboarding/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Loader2, Check, RefreshCw } from "lucide-react";
import { getApiBaseUrl } from "@/utils/api";

interface FormDataState {
  name: string;
  faculty: string;
  height: string;
  gender: string;
  preference: string;
  caption: string;
  mbti: string;
}

const POPULAR_HOBBIES = [
  "ชาบู / หมูกระทะ",
  "คาเฟ่ / กาแฟ",
  "ชานมไข่มุก",
  "ทำอาหาร",
  "เดินเล่น / รับลม",
  "เที่ยวกว๊านพะเยา",
  "เล่นเกม (ROV / Valorant / มือถือ)",
  "ฟังเพลง",
  "ดูหนัง / ซีรีส์ / อนิเมะ",
  "เล่นดนตรี / ร้องเพลง",
  "ตีแบด / แบดมินตัน",
  "วิ่ง / ออกกำลังกาย",
  "ฟิตเนส",
  "อ่านหนังสือ / มังงะ",
  "ถ่ายรูป / คาเฟ่ฮอปปิ้ง",
  "เล่นบอร์ดเกม",
  "ทาสแมว / คนรักสัตว์",
  "ตั้งแคมป์ / เที่ยวธรรมชาติ",
  "ช้อปปิ้ง / เดินตลาดนัด",
  "นอนพักผ่อน",
];

const MBTI_OPTIONS = [
  "",
  "INFP", "INFJ", "ENFP", "ENFJ",
  "INTJ", "INTP", "ENTJ", "ENTP",
  "ISFP", "ISFJ", "ESFP", "ESFJ",
  "ISTP", "ISTJ", "ESTP", "ESTJ",
];

const YEARS = Array.from({ length: 60 }, (_, i) => 2026 - 16 - i);

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [checkingUser, setCheckingUser] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [birthDay, setBirthDay] = useState<string>("1");
  const [birthMonth, setBirthMonth] = useState<string>("1");
  const [birthYear, setBirthYear] = useState<string>("2004");

  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [customHobbyInput, setCustomHobbyInput] = useState<string>("");

  const [imageSlots, setImageSlots] = useState<(File | null)[]>(() => Array(6).fill(null));
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>(() => Array(6).fill(null));
  const [targetSlotIndex, setTargetSlotIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCookie = (name: string): string => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const raw = parts.pop()?.split(";").shift() || "";
      return decodeURIComponent(raw);
    }
    return "";
  };

  useEffect(() => {
    const checkExistingAccount = async () => {
      try {
        const email = getCookie("upmatch_email");
        const token = getCookie("up_match_token");

        if (!email) {
          setCheckingUser(false);
          return;
        }

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
          const prof = data?.profile;
          const isStudentId = /^\d{8}$/.test(prof?.name || "") || prof?.name === prof?.email?.split("@")[0];
          const hasImages = Array.isArray(prof?.images) && prof.images.length > 0;
          const hasCompletedOnboarding = prof?.email && prof?.name && !isStudentId && hasImages && prof?.gender;
          if (hasCompletedOnboarding) {
            router.replace("/swipe");
            return;
          }
        }
      } catch (err) {
        console.error("Error checking existing user:", err);
      } finally {
        setCheckingUser(false);
      }
    };

    checkExistingAccount();
  }, [router]);

  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    faculty: "",
    height: "",
    gender: "ชาย",
    preference: "หญิง",
    caption: "",
    mbti: "",
  });

  const handleToggleHobby = (hobby: string) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  };

  const handleAddCustomHobby = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customHobbyInput.trim();
    if (!trimmed) return;
    if (!selectedHobbies.includes(trimmed)) {
      setSelectedHobbies((prev) => [...prev, trimmed]);
    }
    setCustomHobbyInput("");
  };

  const handleSlotClick = (index: number) => {
    setTargetSlotIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    setImageSlots((prevSlots) => {
      const nextSlots = [...prevSlots];
      const nextPreviews = [...previewUrls];

      if (targetSlotIndex !== null) {
        const firstFile = fileList[0];
        nextSlots[targetSlotIndex] = firstFile;
        nextPreviews[targetSlotIndex] = URL.createObjectURL(firstFile);

        if (fileList.length > 1) {
          let extraIdx = 0;
          for (let i = 0; i < 6 && extraIdx < fileList.length - 1; i++) {
            if (i !== targetSlotIndex && nextSlots[i] === null) {
              const extraFile = fileList[extraIdx + 1];
              nextSlots[i] = extraFile;
              nextPreviews[i] = URL.createObjectURL(extraFile);
              extraIdx++;
            }
          }
        }
      } else {
        let fIdx = 0;
        for (let i = 0; i < 6 && fIdx < fileList.length; i++) {
          if (nextSlots[i] === null) {
            const f = fileList[fIdx];
            nextSlots[i] = f;
            nextPreviews[i] = URL.createObjectURL(f);
            fIdx++;
          }
        }
      }

      // Compact active slots to start
      const activeSlots: File[] = [];
      const activePreviews: string[] = [];
      for (let i = 0; i < 6; i++) {
        if (nextSlots[i]) {
          activeSlots.push(nextSlots[i]!);
          activePreviews.push(nextPreviews[i]!);
        }
      }

      const compactedSlots = Array(6).fill(null);
      const compactedPreviews = Array(6).fill(null);
      activeSlots.forEach((slot, i) => {
        compactedSlots[i] = slot;
        compactedPreviews[i] = activePreviews[i];
      });

      setPreviewUrls(compactedPreviews);
      return compactedSlots;
    });

    setTargetSlotIndex(null);
  };

  const handleRemoveImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageSlots((prev) => {
      const next = [...prev];
      const nextPreviews = [...previewUrls];

      next[index] = null;
      nextPreviews[index] = null;

      const activeSlots: File[] = [];
      const activePreviews: string[] = [];
      for (let i = 0; i < 6; i++) {
        if (next[i]) {
          activeSlots.push(next[i]!);
          activePreviews.push(nextPreviews[i]!);
        }
      }

      const compactedSlots = Array(6).fill(null);
      const compactedPreviews = Array(6).fill(null);
      activeSlots.forEach((slot, i) => {
        compactedSlots[i] = slot;
        compactedPreviews[i] = activePreviews[i];
      });

      setPreviewUrls(compactedPreviews);
      return compactedSlots;
    });
  };

  const handleSubmit = async () => {
    const activeImages = imageSlots.filter((f): f is File => f !== null);
    if (activeImages.length < 2) {
      alert("กรุณาอัปโหลดรูปภาพอย่างน้อย 2 รูปครับ (รูปแรกจะเป็นโปรไฟล์หลัก)");
      return;
    }

    setSubmitting(true);
    try {
      const formattedMonth = String(birthMonth).padStart(2, "0");
      const formattedDay = String(birthDay).padStart(2, "0");
      const fullBirthDate = `${birthYear}-${formattedMonth}-${formattedDay}`;

      const email = getCookie("upmatch_email");

      const data = new FormData();
      data.append("email", email);
      data.append("name", formData.name);
      data.append("faculty", formData.faculty);
      data.append("height", formData.height ? String(formData.height) : "0");
      data.append("birth_date", fullBirthDate);
      data.append("gender", formData.gender);
      data.append("preference", formData.preference);
      data.append("caption", formData.caption);
      data.append("hobbies", selectedHobbies.join(", "));
      data.append("mbti", formData.mbti);

      activeImages.forEach((file) => {
        data.append("images", file);
      });

      const res = await fetch(`${getApiBaseUrl()}/api/v1/profile`, {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        router.push("/swipe");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmitting(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: 1, name: "มกราคม" }, { value: 2, name: "กุมภาพันธ์" }, { value: 3, name: "มีนาคม" },
    { value: 4, name: "เมษายน" }, { value: 5, name: "พฤษภาคม" }, { value: 6, name: "มิถุนายน" },
    { value: 7, name: "กรกฎาคม" }, { value: 8, name: "สิงหาคม" }, { value: 9, name: "กันยายน" },
    { value: 10, name: "ตุลาคม" }, { value: 11, name: "พฤศจิกายน" }, { value: 12, name: "ธันวาคม" }
  ];

  if (checkingUser) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center relative z-10">
        <Loader2 className="w-8 h-8 text-purple-900 animate-spin mb-2" />
        <p className="text-xs font-semibold text-slate-600">กำลังตรวจสอบข้อมูลบัญชี...</p>
      </div>
    );
  }

  const uploadedCount = imageSlots.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-transparent text-slate-800 flex flex-col items-center justify-center relative z-10 overflow-y-auto overflow-x-hidden p-4 py-8">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm w-full max-w-md relative z-10">
        <h1 className="text-xl sm:text-2xl font-black text-slate-950 mb-6 text-center">
          ตั้งค่าโปรไฟล์
          <span className="block text-xs font-bold text-purple-800 mt-1">ขั้นตอนที่ {step} จาก 5</span>
        </h1>

        {/* STEP 1: Name */}
        {step === 1 && (
          <div>
            <label className="block text-slate-700 font-bold mb-2 text-xs">ชื่อเล่น / ชื่อที่จะแสดงบนโปรไฟล์</label>
            <input
              type="text"
              className="w-full px-3.5 py-3 border border-slate-300 rounded-xl mb-6 focus:border-purple-800 focus:ring-1 focus:ring-purple-800 outline-none bg-white text-xs sm:text-sm font-medium"
              placeholder="ชื่อเล่น"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <button
              onClick={() => {
                if (formData.name.trim()) setStep(2);
                else alert("กรุณาใส่ชื่อเล่นก่อนครับ");
              }}
              className="w-full bg-purple-900 hover:bg-purple-950 text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition active:scale-[0.99]"
            >
              หน้าถัดไป
            </button>
          </div>
        )}

        {/* STEP 2: Birth Date */}
        {step === 2 && (
          <div>
            <label className="block text-slate-700 font-bold mb-2 text-xs">วันเดือนปีเกิดของคุณ</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1">วัน</span>
                <select className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none" value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
                  {days.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1">เดือน</span>
                <select className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                  {months.map((m) => <option key={m.value} value={m.value}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1">ปี (ค.ศ.)</span>
                <select className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setStep(1)} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs cursor-pointer">ย้อนกลับ</button>
              <button onClick={() => setStep(3)} className="w-1/2 bg-purple-900 hover:bg-purple-950 text-white py-3 rounded-xl font-bold text-xs shadow-xs cursor-pointer">หน้าถัดไป</button>
            </div>
          </div>
        )}

        {/* STEP 3: Basic Info (Faculty, Height, Gender, Preference, Caption, MBTI) */}
        {step === 3 && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">คณะ</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none focus:border-purple-800 focus:ring-1 focus:ring-purple-800"
                  placeholder="คณะ"
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">ส่วนสูง (ซม.)</label>
                <input
                  type="number"
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none focus:border-purple-800 focus:ring-1 focus:ring-purple-800"
                  placeholder="ส่วนสูง (ซม.)"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">เพศของคุณ</label>
                <select className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                  <option value="LGBTQ+">LGBTQ+</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">ต้องการปัดหาแมตช์กับ</label>
                <select className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none" value={formData.preference} onChange={(e) => setFormData({ ...formData, preference: e.target.value })}>
                  <option value="หญิง">ผู้หญิง</option>
                  <option value="ชาย">ผู้ชาย</option>
                  <option value="ทั้งหมด">ทุกคน</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">บุคลิกภาพ (MBTI)</label>
              <select
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none focus:border-purple-800 focus:ring-1 focus:ring-purple-800"
                value={formData.mbti}
                onChange={(e) => setFormData({ ...formData, mbti: e.target.value })}
              >
                {MBTI_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m === "" ? "ไม่ระบุ" : m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">แคปชั่นสั้นๆ เกี่ยวกับตัวฉัน</label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none focus:border-purple-800 focus:ring-1 focus:ring-purple-800"
                placeholder="แคปชั่นของคุณ"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button onClick={() => setStep(2)} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs cursor-pointer">ย้อนกลับ</button>
              <button onClick={() => setStep(4)} className="w-1/2 bg-purple-900 hover:bg-purple-950 text-white py-3 rounded-xl font-bold text-xs shadow-xs cursor-pointer">หน้าถัดไป</button>
            </div>
          </div>
        )}

        {/* STEP 4: Hobbies Selection (Dedicated Screen) */}
        {step === 4 && (
          <div>
            <div className="mb-3">
              <label className="block text-slate-800 font-bold text-xs">งานอดิเรกที่คุณชอบ</label>
              <p className="text-[11px] text-slate-500">แตะเพื่อเลือกกิจกรรมที่คุณชอบทำในเวลาว่าง (เลือกได้หลายข้อ)</p>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1 pr-1.5 mb-3 border border-slate-200 rounded-xl bg-slate-50/50 [scrollbar-width:thin]">
              {POPULAR_HOBBIES.map((hobby) => {
                const isSelected = selectedHobbies.includes(hobby);
                return (
                  <button
                    key={hobby}
                    type="button"
                    onClick={() => handleToggleHobby(hobby)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-purple-900 text-white shadow-xs scale-[1.02]"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-purple-700"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{hobby}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Hobby Input */}
            <form onSubmit={handleAddCustomHobby} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="พิมพ์งานอดิเรกเพิ่มเติม..."
                value={customHobbyInput}
                onChange={(e) => setCustomHobbyInput(e.target.value)}
                className="flex-1 p-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-purple-800"
              />
              <button
                type="submit"
                disabled={!customHobbyInput.trim()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs disabled:opacity-40 cursor-pointer"
              >
                เพิ่ม
              </button>
            </form>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
              <span>เลือกแล้ว: <strong className="text-purple-900">{selectedHobbies.length}</strong> อย่าง</span>
              {selectedHobbies.length === 0 && <span className="text-[11px] text-slate-400">(สามารถข้ามได้)</span>}
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setStep(3)} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs cursor-pointer">ย้อนกลับ</button>
              <button onClick={() => setStep(5)} className="w-1/2 bg-purple-900 hover:bg-purple-950 text-white py-3 rounded-xl font-bold text-xs shadow-xs cursor-pointer">หน้าถัดไป</button>
            </div>
          </div>
        )}

        {/* STEP 5: Interactive Image Slots (Like Profile Page) */}
        {step === 5 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-800 font-bold text-xs">อัปโหลดรูปภาพ (อย่างน้อย 2 รูป)</label>
              <span className={`text-[11px] font-bold ${uploadedCount >= 2 ? "text-purple-900" : "text-rose-600"}`}>
                {uploadedCount}/6 รูป
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3.5">
              แตะที่แต่ละช่องเพื่อเพิ่มรูปภาพ • รูปแรกจะเป็นรูปโปรไฟล์หลัก
            </p>

            {/* 6 Photo Interactive Slots */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const preview = previewUrls[index];
                const isFilled = Boolean(preview);
                const isMain = index === 0;

                return (
                  <div
                    key={index}
                    onClick={() => handleSlotClick(index)}
                    className={`group relative aspect-[4/5] rounded-xl select-none transition-all duration-150 overflow-hidden ${
                      isFilled
                        ? "border-2 border-slate-200 hover:border-purple-800 shadow-2xs cursor-pointer"
                        : "border-2 border-dashed border-slate-300 hover:border-purple-800 bg-slate-50 hover:bg-purple-50/50 flex flex-col items-center justify-center cursor-pointer"
                    }`}
                  >
                    {/* Slot Number Badge */}
                    <div
                      className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isFilled ? "bg-black/60 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {index + 1}
                    </div>

                    {isFilled ? (
                      <>
                        {isMain && (
                          <div className="absolute top-1.5 left-7 z-10 bg-purple-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                            รูปหลัก
                          </div>
                        )}

                        <img
                          src={preview!}
                          alt={`Slot ${index + 1}`}
                          className="w-full h-full object-cover pointer-events-none"
                        />

                        {/* Remove Image Button */}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveImage(index, e)}
                          title="ลบรูปนี้"
                          className="absolute bottom-1.5 right-1.5 z-20 w-6 h-6 bg-white text-rose-600 rounded-full flex items-center justify-center shadow-xs border border-slate-200 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>

                        {/* Replace badge on hover */}
                        <div className="absolute bottom-1.5 left-1.5 z-10 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>แทนที่</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-slate-200 group-hover:bg-purple-100 group-hover:text-purple-900 text-slate-600 flex items-center justify-center transition">
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 group-hover:text-purple-900 mt-1 transition">
                          เพิ่มรูป
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hidden Input for slot clicking */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs cursor-pointer"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-1/2 bg-purple-900 hover:bg-purple-950 text-white py-3 rounded-xl font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>เสร็จสิ้น</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}