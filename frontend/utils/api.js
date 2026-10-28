// frontend/utils/api.js

/**
 * คืนค่า Base URL ของ Backend API จาก .env (NEXT_PUBLIC_API_URL)
 * - ค่าเริ่มต้น: ดึงจาก process.env.NEXT_PUBLIC_API_URL หรือ http://localhost:8081
 * - บนอุปกรณ์อื่นในวง LAN เช่น iPad/มือถือ จะแปลง Host เป็น IP ของเครื่องที่กำลังเข้าถึงให้อัตโนมัติ
 */
export function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    const isPrivateIp = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host);

    // 1. กรณี Localhost ในการพัฒนา ให้ใช้ Relative Path ผ่าน Next.js Rewrites เสมอ
    if (isLocal) {
      return "";
    }

    // 2. ถ้ามี NEXT_PUBLIC_API_URL ชัดเจนและไม่ใช่ localhost ให้ใช้ค่านั้นได้ทันที
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }

    // 3. ถ้าเข้าใช้งานผ่านโดเมนสาธารณะ หรือวง LAN (เช่น iPad 192.168.x.x)
    if (!isLocal || isPrivateIp) {
      return window.location.origin;
    }

    // 4. Fallback กรณีอื่นๆ
    return envUrl || "http://localhost:8081";
  }

  // ฝั่ง SSR / Node.js เรียกตรงไปยัง Backend ภายในเครื่อง
  return process.env.INTERNAL_BACKEND_URL || "http://127.0.0.1:8081";
}

/**
 * แปลง URL ของรูปภาพให้ถูกต้องตามอุปกรณ์ที่เปิดใช้งาน (แก้ปัญหารูปไม่โหลดบน iPad / มือถือ)
 * - ถ้า Backend ส่ง Absolute URL เดิม (เช่น localhost:8080 หรือ 8081) จะถูกแปลงเป็น Base URL ปัจจุบัน
 * - ถ้ารูปเป็น /uploads/... หรือ Relative Path จะเติม Base URL ให้สมบูรณ์
 */
export function formatImageUrl(url) {
  if (!url) return "/placeholder.jpg";
  if (typeof url !== "string") return "/placeholder.jpg";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  const baseUrl = getApiBaseUrl();

  // กรณี Backend ส่ง URL เต็มที่มี localhost หรือ 127.0.0.1
  if (/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)) {
    return url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, baseUrl);
  }

  // กรณีส่งมาเป็น relative path เช่น /uploads/xxx.png หรือ uploads/xxx.png
  if (url.startsWith("/uploads")) {
    return `${baseUrl}${url}`;
  }
  if (url.startsWith("uploads/")) {
    return `${baseUrl}/${url}`;
  }

  return url;
}


