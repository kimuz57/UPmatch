// frontend/app/onboarding/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-900 animate-spin mb-2" />
        <p className="text-xs font-semibold text-slate-600">กำลังตรวจสอบข้อมูลบัญชี...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center relative overflow-y-auto overflow-x-hidden p-4 py-8">
      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm w-full max-w-md relative z-10">
        <h1 className="text-xl sm:text-2xl font-black text-slate-950 mb-6 text-center">
          ตั้งค่าโปรไฟล์ UPer
          <span className="block text-xs font-bold text-purple-800 mt-1">ขั้นตอนที่ {step} จาก 4</span>
        </h1>

        {step === 1 && (
          <div>
            <label className="block text-slate-700 font-bold mb-2 text-xs">ชื่อเล่น / ชื่อที่จะแสดงบนโปรไฟล์</label>
            <input
              type="text"
              className="w-full px-3.5 py-3 border border-slate-300 rounded-xl mb-6 focus:border-purple-800 focus:ring-1 focus:ring-purple-800 outline-none bg-white text-xs sm:text-sm font-medium"
              placeholder="เช่น ฟ้าใส"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <button
              onClick={() => { if (formData.name) setStep(2); else alert("กรุณาใส่ชื่อก่อนครับ"); }}
              className="w-full bg-purple-900 hover:bg-purple-950 text-white py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs cursor-pointer transition active:scale-[0.99]"
            >
              หน้าถัดไป
            </button>
          </div>
        )}

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
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setStep(1)} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs cursor-pointer">ย้อนกลับ</button>
              <button onClick={() => setStep(3)} className="w-1/2 bg-purple-900 hover:bg-purple-950 text-white py-3 rounded-xl font-bold text-xs shadow-xs cursor-pointer">หน้าถัดไป</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">คณะ (ถ้ามี)</label>
              <input
                type="text"
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none focus:border-purple-800 focus:ring-1 focus:ring-purple-800"
                placeholder="เช่น เทคโนโลยีสารสนเทศและการสื่อสาร (ICT)"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">เพศของคุณ</label>
              <select className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="ชาย">ชาย</option><option value="หญิง">หญิง</option><option value="LGBTQ+">LGBTQ+</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">ต้องการปัดหาแมตช์กับ</label>
              <select className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none" value={formData.preference} onChange={(e) => setFormData({ ...formData, preference: e.target.value })}>
                <option value="หญิง">ผู้หญิง</option><option value="ชาย">ผู้ชาย</option><option value="ทั้งหมด">ทุกคน</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-1">แคปชั่นสั้นๆ เกี่ยวกับตัวฉัน</label>
              <input type="text" className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-xs outline-none focus:border-purple-800 focus:ring-1 focus:ring-purple-800" placeholder="เช่น หาเพื่อนกินหมูกระทะ..." value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} />
            </div>
            <div className="flex gap-2.5 pt-2">
              <button onClick={() => setStep(2)} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs cursor-pointer">ย้อนกลับ</button>
              <button onClick={() => setStep(4)} className="w-1/2 bg-purple-900 hover:bg-purple-950 text-white py-3 rounded-xl font-bold text-xs shadow-xs cursor-pointer">หน้าถัดไป</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <label className="block text-slate-800 font-bold mb-1 text-xs">อัปโหลดรูปภาพ (อย่างน้อย 2 รูป)</label>
            <p className="text-[11px] text-slate-500 mb-3 font-normal">รูปแรกจะถูกตั้งเป็นรูปโปรไฟล์หลักโดยอัตโนมัติ</p>
            <div className="grid grid-cols-3 gap-2.5 mb-3.5">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const preview = formData.previewUrls[index];
                return (
                  <div key={index} className="aspect-square rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                    {preview ? (
                      <>
                        <img src={preview} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                        {index === 0 && <span className="absolute bottom-1 bg-purple-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">รูปหลัก</span>}
                        <button onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full cursor-pointer"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <div className="text-center text-slate-400 p-2"><ImageIcon className="w-5 h-5 mx-auto mb-1 opacity-50" /><span className="text-[10px]">ช่องที่ {index + 1}</span></div>
                    )}
                  </div>
                );
              })}
            </div>
            <input type="file" multiple accept="image/*" className="w-full p-2.5 border border-slate-300 rounded-xl mb-4 text-xs bg-white" onChange={handleFileChange} />
            <div className="flex gap-2.5">
              <button onClick={() => setStep(3)} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs cursor-pointer">ย้อนกลับ</button>
              <button onClick={handleSubmit} className="w-1/2 bg-purple-900 hover:bg-purple-950 text-white py-3 rounded-xl font-bold text-xs shadow-xs cursor-pointer">เสร็จสิ้น</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}