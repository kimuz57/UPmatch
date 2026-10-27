// frontend/utils/api.js

/**
 * คืนค่า Base URL ของ Backend API จาก .env (NEXT_PUBLIC_API_URL)
 * - ค่าเริ่มต้น: ดึงจาก process.env.NEXT_PUBLIC_API_URL หรือ http://localhost:8081
 * - บนอุปกรณ์อื่นในวง LAN เช่น iPad/มือถือ จะแปลง Host เป็น IP ของเครื่องที่กำลังเข้าถึงให้อัตโนมัติ
 */
export function getApiBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      try {
        const parsed = new URL(envUrl);
        if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
          const portStr = parsed.port ? `:${parsed.port}` : "";
          return `${parsed.protocol}//${host}${portStr}`;
        }
      } catch (e) {
        return envUrl.replace(/https?:\/\/(localhost|127\.0\.0\.1)/, (match) =>
          match.replace(/(localhost|127\.0\.0\.1)/, host)
        );
      }
    }
  }

  return envUrl;
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


