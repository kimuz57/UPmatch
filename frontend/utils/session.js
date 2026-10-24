// frontend/utils/session.js

/**
 * สร้าง Token Signature จาก Token ของผู้ใช้เพื่อใส่บน URL
 * ช่วยป้องกันไม่ให้คนอื่นสามารถเปิดแชทจากการก็อปลิงก์ได้
 */
export function getSessionSignature(token) {
  if (!token) return "";
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < token.length; i++) {
    const ch = token.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `sid_${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}
