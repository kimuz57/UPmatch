// frontend/components/AuthPage.jsx
"use client";

import React, { useState, useMemo } from "react";
// avoid-ai-design-ignore: I3
import {
  Mail,
  ShieldCheck,
  Send,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Check,
  CheckCircle2,
  ShieldAlert,
  X,
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
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const email = useMemo(() => {
    const clean = studentId.trim();
    return clean ? `${clean}@up.ac.th` : "";
  }, [studentId]);

  const parsed = useMemo(() => parseStudentEmail(email), [email]);

  const handleStudentIdChange = (e) => {
    let val = e.target.value.trim();
    if (val.includes("@")) {
      val = val.split("@")[0];
    }
    val = val.replace(/\D/g, "").slice(0, 8);
    setStudentId(val);
  };

  const handleRequestOtpSubmit = (e) => {
    e.preventDefault();
    if (!parsed.isValidUpEmail) {
      setErrorMsg(parsed.error);
      return;
    }
    setErrorMsg("");
    setShowDisclaimer(true);
  };

  const handleConfirmDisclaimer = async () => {
    if (loading) return;
    await doSendOtp();
  };

  const doSendOtp = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg("");

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
      setShowDisclaimer(false);
      setStep("otp");
    } catch (err) {
      setErrorMsg(
        err.message || "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ",
      );
      setShowDisclaimer(false);
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

    const referralCode =
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("upmatch_referral_code")) ||
      (typeof localStorage !== "undefined" && localStorage.getItem("upmatch_referral_code")) ||
      "";

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          referral_code: referralCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว");
      }

      if (referralCode) {
        try {
          sessionStorage.removeItem("upmatch_referral_code");
          localStorage.removeItem("upmatch_referral_code");
        } catch (e) {}
      }

      const cleanEmail = email.trim().toLowerCase();

      const sessionToken = data.token;
      if (sessionToken) {
        document.cookie = `up_match_token=${sessionToken}; path=/; max-age=604800; SameSite=Lax`;
      }
      document.cookie = `upmatch_email=${cleanEmail}; path=/; max-age=604800; SameSite=Lax`;

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
    <div className="min-h-screen bg-transparent text-slate-800 flex items-center justify-center p-4 py-8 relative z-10 overflow-y-auto overflow-x-hidden">
      
      {/* Crisp Solid Card */}
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm relative z-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-900 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </button>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="UPyes" className="w-14 h-14" />
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                UPyes
              </span>
              <span className="block text-[10px] font-bold text-purple-800">
                
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-800" />
            <span>@up.ac.th</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-950">
            {step === "email"
              ? "เข้าสู่ระบบ"
              : "กรอกรหัส OTP 6 หลัก"}
          </h1>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
            {step === "email"
              ? "ใช้อีเมลนิสิต @up.ac.th เพื่อรับรหัส OTP ปลอดภัย ไม่ต้องใช้รหัสผ่านอีเมลมอของคุณ"
              : `กรอกรหัส 6 หลักที่ระบบส่งไปยัง ${email}`}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-800" />
            <span>{infoMsg}</span>
          </div>
        )}

        {step === "otp" && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Mail className="w-4 h-4 text-purple-800 shrink-0" />
              <span>ตรวจสอบที่ Microsoft Outlook (@up.ac.th)</span>
            </div>
            <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
              หากไม่พบรหัสในกล่องจดหมายเข้า โปรดตรวจสอบในโฟลเดอร์ <strong className="text-slate-900 font-bold">อีเมลขยะ (Junk Email)</strong> หรือ <strong className="text-slate-900 font-bold">สแปม (Spam)</strong>
            </p>
            <div className="pl-6 pt-0.5">
              <a
                href="https://outlook.office.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 hover:text-purple-950 underline underline-offset-2"
              >
                เปิด Microsoft Outlook Web
              </a>
            </div>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleRequestOtpSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  รหัสนิสิต ม.พะเยา (8 หลัก)
                </label>
                {studentId.length === 8 && parsed.isValidUpEmail && (
                  <span className="text-[11px] font-bold text-purple-800 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-purple-700" />
                    {parsed.calculatedYear ? `นิสิตชั้นปีที่ ${parsed.calculatedYear}` : "รหัสถูกต้อง"}
                  </span>
                )}
              </div>
              <div className="relative flex items-center rounded-xl bg-white border border-slate-300 focus-within:border-purple-800 focus-within:ring-2 focus-within:ring-purple-800/10 transition-all shadow-xs overflow-hidden">
                <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-purple-800" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={studentId}
                  onChange={handleStudentIdChange}
                  placeholder="เช่น 67021589"
                  className="w-full py-3 pr-2 bg-transparent text-sm font-semibold tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:outline-none"
                  required
                  autoFocus
                />
                <div className="pr-3.5 pl-2.5 py-3 bg-slate-50 border-l border-slate-200 text-xs font-bold text-purple-900 select-none flex items-center gap-1 shrink-0">
                  <span className="text-purple-800 font-black">@</span>up.ac.th
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!parsed.isValidUpEmail || loading}
              className="w-full py-3.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 transition cursor-pointer"
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
              className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-300 text-center text-2xl font-black tracking-widest text-slate-900 focus:outline-none focus:border-purple-800 focus:ring-2 focus:ring-purple-800/10 transition"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังตรวจสอบรหัส OTP...</span>
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
              className="w-full py-2 text-xs text-slate-500 hover:text-purple-900 font-semibold cursor-pointer transition"
            >
              เปลี่ยนรหัสนิสิต
            </button>
          </form>
        )}
      </div>

      {/* Disclaimer & Terms Modal before sending OTP */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    ข้อกำหนดและข้อจำกัดความรับผิดชอบ
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">UPyes Independent Student Project</p>
                </div>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowDisclaimer(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                <h3 className="font-bold text-amber-950 flex items-center gap-1.5">
                  1. การไม่มีความเกี่ยวข้องกับมหาวิทยาลัย (No Official Affiliation)
                </h3>
                <p className="text-[11px] text-amber-900 leading-normal">
                  เว็บไซต์ UPyes เป็นโครงงานอิสระที่พัฒนาขึ้นโดยนิสิต <strong>ไม่มีความเกี่ยวข้อง ไม่ได้รับการสนับสนุน และไม่ได้ดำเนินการอย่างเป็นทางการโดยมหาวิทยาลัยพะเยา (University of Phayao)</strong> ชื่อมหาวิทยาลัยหรือคำเรียกถูกนำมาใช้เพื่อระบุกลุ่มเป้าหมายเชิงพื้นที่เท่านั้น
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-900">
                  2. วัตถุประสงค์ของโครงการ (Educational Purpose)
                </h3>
                <p className="text-slate-600">
                  โครงการนี้จัดทำขึ้นเพื่อการศึกษา ค้นคว้า และพัฒนาทักษะด้าน Software Engineering และการพัฒนาเว็บแอปพลิเคชัน รวมถึงเป็นพื้นที่สื่อกลางช่วยให้นิสิตในมหาวิทยาลัยทำความรู้จักและสร้างมิตรภาพเชิงสร้างสรรค์
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-900">
                  3. ข้อจำกัดความรับผิดชอบ (Limitation of Liability)
                </h3>
                <p className="text-slate-600">
                  ผู้พัฒนาไม่มีส่วนเกี่ยวข้องและไม่รับผิดชอบต่อพฤติกรรม ข้อความ การสนทนา การนัดหมาย หรือความเสียหายใดๆ ทั้งทางตรงและทางอ้อมที่เกิดขึ้นระหว่างผู้ใช้งาน ผู้ใช้บริการพึงใช้วิจารณญาณส่วนบุคคลในการตัดสินใจและติดต่อสื่อสาร
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <h3 className="font-bold text-slate-900">
                  4. คำแนะนำเพื่อความปลอดภัย (Safety Guidelines)
                </h3>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                  <li><strong>ห้ามโอนเงิน</strong> หรือให้ข้อมูลทางการเงิน เลขบัญชี หรือรหัสผ่านแก่ผู้อื่นโดยเด็ดขาด</li>
                  <li>ระมัดระวังการเปิดเผยข้อมูลส่วนบุคคลหรือสถานที่พักอาศัยแก่คนแปลกหน้า</li>
                  <li>หากมีการนัดพบ ควรนัดพบในเวลากลางวันและสถานที่สาธารณะที่มีผู้คนสัญจร</li>
                </ul>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-900">
                  5. ข้อมูลส่วนบุคคล (Data Privacy)
                </h3>
                <p className="text-[11px] text-slate-500">
                  อีเมลสถาบัน <strong className="text-slate-700">{email}</strong> จะใช้เพื่อวัตถุประสงค์ในการจัดส่งรหัสยืนยัน OTP เพื่อยืนยันสถานะนิสิตเท่านั้น ระบบไม่มีนโยบายจำหน่าย ส่งต่อ หรือเปิดเผยข้อมูลของท่านแก่บุคคลภายนอก
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowDisclaimer(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmDisclaimer}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs shadow-xs cursor-pointer transition active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังส่งรหัส OTP...</span>
                  </>
                ) : (
                  <span>รับทราบและเข้าใจข้อตกลง</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
