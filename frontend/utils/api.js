// frontend/utils/api.js

/**
 * คืนค่า Base URL ของ Backend API อัตโนมัติ
 * - บนเครื่องคอมพิวเตอร์ (localhost หรือ 127.0.0.1) -> http://localhost:8080
 * - บนอุปกรณ์อื่นในวง LAN เช่น iPad (192.168.1.109:3003) -> http://192.168.1.109:8080
 */
export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:8080`;
    }
  }
  return "http://localhost:8080";
}

/**
 * แปลง URL ของรูปภาพให้ถูกต้องตามอุปกรณ์ที่เปิดใช้งาน (แก้ปัญหารูปไม่โหลดบน iPad / มือถือ)
 * - ถ้า Backend ส่ง http://localhost:8080/uploads/... จะถูกแปลงเป็น http://[IP_คอม]:8080/uploads/... อัตโนมัติบน iPad
 * - ถ้ารูปเป็น /uploads/... หรือ Relative Path จะเติม Base URL ที่ถูกต้องให้
 */
export function formatImageUrl(url) {
  if (!url) return "/placeholder.jpg";
  if (typeof url !== "string") return "/placeholder.jpg";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  const baseUrl = getApiBaseUrl();

  // กรณี Backend ส่ง http://localhost:8080 หรือ http://127.0.0.1:8080 มา
  if (url.includes("localhost:8080") || url.includes("127.0.0.1:8080")) {
    return url.replace(/https?:\/\/(localhost|127\.0\.0\.1):8080/, baseUrl);
  }

  // กรณีส่งมาเป็น relative path เช่น /uploads/xxx.png
  if (url.startsWith("/uploads")) {
    return `${baseUrl}${url}`;
  }

  return url;
}

