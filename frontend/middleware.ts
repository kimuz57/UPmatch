// frontend/middleware.js (หรือ middleware.ts)
import { NextResponse } from 'next/server';

function getSessionSignature(tok: string): string {
  if (!tok) return "";
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < tok.length; i++) {
    const ch = tok.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `sid_${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // 1. กำหนดหน้าเว็บที่ "ต้องล็อกอิน" เท่านั้นถึงจะเข้าได้
  const isProtectedRoute = 
    path.startsWith('/swipe') || 
    path.startsWith('/onboarding') || 
    path.startsWith('/chat') || 
    path.startsWith('/matches') || 
    path.startsWith('/profile');

  // 2. ดึง Token และ Email จาก Cookie (ที่เซฟไว้ตอนยืนยัน OTP)
  const tokenCookie = request.cookies.get('up_match_token')?.value;
  const emailCookie = request.cookies.get('upmatch_email')?.value;
  const token = tokenCookie || emailCookie;

  // 3. ถ้าพยายามเข้าหน้าสงวน (Protected) แต่ "ไม่มี Token" -> เตะกลับไปหน้าแรกทันที
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. ตรวจสอบหน้าห้องแชท (/chat/[id])
  // ถ้าก็อปลิงก์ที่มี token session มาเปิด แต่ token ไม่ตรงกับของผู้ใช้ -> เตะกลับหน้าแรกทันที
  if (path.startsWith('/chat/') && path !== '/chat') {
    const urlToken = request.nextUrl.searchParams.get('token') || request.nextUrl.searchParams.get('sid');
    if (urlToken) {
      if (!token) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      const validSigs = [
        tokenCookie ? getSessionSignature(tokenCookie) : "",
        emailCookie ? getSessionSignature(emailCookie) : "",
        tokenCookie || "",
        emailCookie || "",
      ].filter(Boolean);

      if (!validSigs.includes(urlToken)) {
        // Token บน URL ไม่ตรงกับ session ของคนที่เปิด -> เตะกลับหน้าแรกทันที
        return NextResponse.redirect(new URL('/?unauthorized=1', request.url));
      }
    }
  }

  // 5. ถ้ามี Token อยู่แล้วแต่แอบมากดเข้าหน้าแรก (/) -> บังคับเด้งไปหน้า /swipe ทันที
  // ยกเว้นกรณีมี unauthorized parameter ที่ถูกเตะออกมา
  if (path === '/' && token && !request.nextUrl.searchParams.get('unauthorized')) {
    return NextResponse.redirect(new URL('/swipe', request.url));
  }

  // ผ่านด่านตรวจ ปล่อยให้เข้าเว็บได้ตามปกติ
  return NextResponse.next();
}

// กำหนดให้ Middleware ทำงานเฉพาะเส้นทางที่เราสนใจ เพื่อไม่ให้หน่วงเว็บ
export const config = {
  matcher: [
    '/',
    '/swipe/:path*',
    '/onboarding/:path*',
    '/chat/:path*',
    '/matches/:path*',
    '/profile/:path*'
  ],
};