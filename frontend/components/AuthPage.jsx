// frontend/components/AuthPage.jsx
"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  HeartHandshake,
  Loader2,
  ArrowLeft,
  Heart,
} from "lucide-react";
import { parseStudentEmail } from "../utils/emailParser";
import { getApiBaseUrl } from "../utils/api";


export default function AuthPage({ onLoginSuccess, onBack }) {
  const [step, setStep] = useState("email"); // 'email' | 'otp'
  const [studentId, setStudentId] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const email = useMemo(() => {
    const clean = studentId.trim();
    return clean ? `${clean}@up.ac.th` : "";
  }, [studentId]);

  const parsed = useMemo(() => parseStudentEmail(email), [email]);

  const handleStudentIdChange = (e) => {
    let val = e.target.value.trim();
    // ถ้าผู้ใช้เผลอก็อปปี้อีเมลเต็มๆ มาแปะ เช่น 67021589@up.ac.th ให้ตัดเหลือเฉพาะรหัสนิสิต
    if (val.includes("@")) {
      val = val.split("@")[0];
    }
    // รับเฉพาะตัวเลข และจำกัดความยาวไม่เกิน 8 หลัก
    val = val.replace(/\D/g, "").slice(0, 8);
    setStudentId(val);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!parsed.isValidUpEmail) {
      setErrorMsg(parsed.error);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          year: parsed.calculatedYear,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถส่งรหัส OTP ได้");
      }

      setInfoMsg(
        data.message || "ส่งรหัส OTP ไปที่อีเมล @up.ac.th เรียบร้อยแล้ว",
      );
      setStep("otp");
    } catch (err) {
      setErrorMsg(
        err.message || "เชื่อมต่อเซิร์ฟเวอร์ Go (พอร์ต 8080) ไม่สำเร็จ",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setErrorMsg("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว");
      }

      const cleanEmail = email.trim().toLowerCase();

      // ✅ บันทึก Unique Session Token และ Email ลง Cookie
      const sessionToken = data.token;
      if (sessionToken) {
        document.cookie = `up_match_token=${sessionToken}; path=/; max-age=604800; SameSite=Lax`;
      }
      document.cookie = `upmatch_email=${cleanEmail}; path=/; max-age=604800; SameSite=Lax`;

      // ส่งต่อไปหน้า Onboarding
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      } else {
        window.location.href = "/onboarding";
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-800 flex items-center justify-center p-4 py-8 relative overflow-y-auto overflow-x-hidden">


      {/* การ์ด Glassmorphism */}
      <div className="max-w-md w-full bg-white/85 sm:bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-5 sm:p-9 space-y-5 sm:space-y-6 shadow-xl shadow-purple-100 relative z-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </button>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-400 to-pink-400 flex items-center justify-center text-white shadow-md shadow-purple-200">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-800">
                UP Match
              </span>
              <span className="block text-[10px] font-bold text-purple-500">
                คอมมูนิตี้ชาว ม.พะเยา
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>@up.ac.th เท่านั้น</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            {step === "email"
              ? "เข้าสู่ระบบนิสิต ม.พะเยา 💜💛"
              : "กรอกรหัส OTP 6 หลัก 📩"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {step === "email"
              ? "ใช้อีเมลนิสิต @up.ac.th เพื่อรับรหัส OTP (ระบบไม่ขอรหัสผ่านอีเมลมอของคุณ)"
              : `กรอกรหัส 6 หลักที่ส่งไปยัง ${email}`}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-600">
                  รหัสนิสิต ม.พะเยา (8 หลัก)
                </label>
                {studentId.length === 8 && parsed.isValidUpEmail && (
                  <span className="text-[11px] font-bold text-purple-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                    {parsed.calculatedYear ? `นิสิตชั้นปีที่ ${parsed.calculatedYear}` : "รหัสถูกต้อง"}
                  </span>
                )}
              </div>
              <div className="relative flex items-center rounded-2xl bg-white/80 border border-purple-100 focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-100/70 focus-within:bg-white transition-all shadow-xs overflow-hidden">
                <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-purple-400" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={studentId}
                  onChange={handleStudentIdChange}
                  placeholder="เช่น 67021589"
                  className="w-full py-3 pr-2 bg-transparent text-sm font-semibold tracking-wider text-slate-800 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal focus:outline-none"
                  required
                  autoFocus
                />
                <div className="pr-3.5 pl-2.5 py-3 bg-purple-50/90 border-l border-purple-100/80 text-xs font-bold text-purple-600 select-none flex items-center gap-1 shrink-0">
                  <span className="text-purple-400 font-extrabold">@</span>up.ac.th
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!parsed.isValidUpEmail || loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-40 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังส่งรหัส OTP...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ขอรับรหัส OTP ทางอีเมล</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="กรอกรหัส 6 หลัก"
              className="w-full px-4 py-3.5 rounded-2xl bg-white/80 border border-purple-100 text-center text-2xl font-black tracking-widest text-slate-800 focus:bg-white focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-200 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังตรวจสอบกับ Redis...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันรหัส OTP และเข้าสู่ระบบ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setErrorMsg("");
                setInfoMsg("");
              }}
              className="w-full py-2 text-xs text-slate-400 hover:text-purple-600 font-semibold cursor-pointer transition"
            >
              ← เปลี่ยนรหัสนิสิต
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
