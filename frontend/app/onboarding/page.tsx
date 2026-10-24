// frontend/app/onboarding/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { getApiBaseUrl } from "@/utils/api";


interface FormDataState {
  name: string;
  faculty: string;
  gender: string;
  preference: string;
  caption: string;
  hobbies: string;
  mbti: string;
  images: File[];
  previewUrls: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [checkingUser, setCheckingUser] = useState<boolean>(true);

  const [birthDay, setBirthDay] = useState<string>("1");
  const [birthMonth, setBirthMonth] = useState<string>("1");
  const [birthYear, setBirthYear] = useState<string>("2004");
  const [years, setYears] = useState<number[]>([]);

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
    const currentYear = new Date().getFullYear();
    const generatedYears = Array.from({ length: 50 }, (_, i) => currentYear - 17 - i);
    setYears(generatedYears);

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
          if (data?.profile?.email && data?.profile?.name) {
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
    gender: "ชาย",
    preference: "หญิง",
    caption: "",
    hobbies: "",
    mbti: "",
    images: [],
    previewUrls: [],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setFormData({
        ...formData,
        images: [...formData.images, ...files],
        previewUrls: [...formData.previewUrls, ...newPreviews],
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    const updatedPreviews = formData.previewUrls.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: updatedImages,
      previewUrls: updatedPreviews,
    });
  };

  const handleSubmit = async () => {
    if (formData.images.length < 2) {
      alert("กรุณาอัปโหลดรูปภาพอย่างน้อย 2 รูปครับ (รูปแรกจะเป็นโปรไฟล์หลัก)");
      return;
    }

    const formattedMonth = String(birthMonth).padStart(2, "0");
    const formattedDay = String(birthDay).padStart(2, "0");
    const fullBirthDate = `${birthYear}-${formattedMonth}-${formattedDay}`;

    const email = getCookie("upmatch_email");

    const data = new FormData();
    data.append("email", email);
    data.append("name", formData.name);
    data.append("faculty", formData.faculty);
    data.append("birth_date", fullBirthDate);
    data.append("gender", formData.gender);
    data.append("preference", formData.preference);
    data.append("caption", formData.caption);
    data.append("hobbies", formData.hobbies);
    data.append("mbti", formData.mbti);

    formData.images.forEach((file) => {
      data.append("images", file);
    });

    const res = await fetch(`${getApiBaseUrl()}/api/v1/profile`, {
      method: "POST",
      body: data,
    });

    if (res.ok) {
      alert("สร้างโปรไฟล์สำเร็จ! ไปลุยหน้าหลักกันเลย");
      router.push("/swipe");
    } else {
      const err = await res.json();
      alert(err.error || "เกิดข้อผิดพลาด");
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
        <p className="text-sm font-bold text-purple-600">กำลังตรวจสอบข้อมูลบัญชี...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-800 flex flex-col items-center justify-center relative overflow-y-auto overflow-x-hidden p-4 py-8">


      <div className="bg-white/80 border border-purple-50 p-8 rounded-3xl shadow-xl w-full max-w-md relative z-10 backdrop-blur-md">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6 text-center">
          💖 ตั้งค่าโปรไฟล์ UPer{" "}
          <span className="block text-xs font-bold text-purple-500 mt-1">ขั้นตอนที่ {step} จาก 4</span>
        </h2>

        {step === 1 && (
          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm">ชื่อเล่น / ชื่อที่จะแสดงบนโปรไฟล์</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-purple-100 rounded-2xl mb-6 focus:ring-2 focus:ring-purple-400 outline-none bg-purple-50/30 text-sm"
              placeholder="เช่น น้องพะเยา"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <button
              onClick={() => { if (formData.name) setStep(2); else alert("กรุณาใส่ชื่อก่อนครับ"); }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-400 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-purple-200 cursor-pointer"
            >
              หน้าถัดไป ➔
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-slate-700 font-semibold mb-2 text-sm">วันเดือนปีเกิดของคุณ</label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1">วัน</span>
                <select className="w-full p-3 border border-purple-100 rounded-2xl bg-purple-50/30 text-sm outline-none" value={birthDay} onChange={(e) => setBirthDay(e.target.value)}>
                  {days.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1">เดือน</span>
                <select className="w-full p-3 border border-purple-100 rounded-2xl bg-purple-50/30 text-sm outline-none" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}>
                  {months.map((m) => <option key={m.value} value={m.value}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1">ปี (ค.ศ.)</span>
                <select className="w-full p-3 border border-purple-100 rounded-2xl bg-purple-50/30 text-sm outline-none" value={birthYear} onChange={(e) => setBirthYear(e.target.value)}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="w-1/2 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold">ย้อนกลับ</button>
              <button onClick={() => setStep(3)} className="w-1/2 bg-gradient-to-r from-purple-500 to-pink-400 text-white py-3.5 rounded-2xl font-bold">หน้าถัดไป ➔</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">คณะ (ถ้ามี)</label>
              <input
                type="text"
                className="w-full p-3 border border-purple-100 rounded-2xl bg-purple-50/30 text-sm outline-none"
                placeholder="เช่น เทคโนโลยีสารสนเทศและการสื่อสาร (ICT)"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">เพศของคุณ</label>
              <select className="w-full p-3 border border-purple-100 rounded-2xl bg-purple-50/30 text-sm outline-none" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="ชาย">ชาย</option><option value="หญิง">หญิง</option><option value="LGBTQ+">LGBTQ+</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">ต้องการปัดหาแมตช์กับ</label>
              <select className="w-full p-3 border border-purple-100 rounded-2xl bg-purple-50/30 text-sm outline-none" value={formData.preference} onChange={(e) => setFormData({ ...formData, preference: e.target.value })}>
                <option value="หญิง">ผู้หญิง</option><option value="ชาย">ผู้ชาย</option><option value="ทั้งหมด">ทุกคน</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">แคปชั่นสั้นๆ เกี่ยวกับตัวฉัน</label>
              <input type="text" className="w-full p-3 border border-purple-100 rounded-2xl bg-purple-50/30 text-sm outline-none" placeholder="เช่น โสดโปรดจีบ..." value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-3">
              <button onClick={() => setStep(2)} className="w-1/2 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold">ย้อนกลับ</button>
              <button onClick={() => setStep(4)} className="w-1/2 bg-gradient-to-r from-purple-500 to-pink-400 text-white py-3.5 rounded-2xl font-bold">หน้าถัดไป ➔</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-sm">อัปโหลดรูปภาพ (อย่างน้อย 2 รูป)</label>
            <p className="text-xs text-purple-600 mb-4 font-medium">💡 รูปแรกจะถูกตั้งเป็นรูปโปรไฟล์หลักโดยอัตโนมัติ</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const preview = formData.previewUrls[index];
                return (
                  <div key={index} className="aspect-square rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 flex flex-col items-center justify-center relative overflow-hidden">
                    {preview ? (
                      <>
                        <img src={preview} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                        {index === 0 && <span className="absolute bottom-1 bg-purple-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">หลัก ⭐</span>}
                        <button onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <div className="text-center text-slate-400 p-2"><ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" /><span className="text-[10px]">ช่องที่ {index + 1}</span></div>
                    )}
                  </div>
                );
              })}
            </div>
            <input type="file" multiple accept="image/*" className="w-full p-3 border border-purple-200 rounded-2xl mb-4 text-xs bg-white" onChange={handleFileChange} />
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="w-1/2 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold">ย้อนกลับ</button>
              <button onClick={handleSubmit} className="w-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white py-3.5 rounded-2xl font-bold">เสร็จสิ้น 🎉</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}