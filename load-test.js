import http from 'k6/http';
import { check, sleep } from 'k6';

// กำหนดเงื่อนไขการไต่ระดับโหลด (Stages)
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // 30 วินาทีแรก: ไต่ระดับขึ้นไป 20 คน
    { duration: '1m',  target: 50 },  // 1 นาทีถัดมา: เพิ่มเป็น 50 คน
    { duration: '1m',  target: 100 }, // 1 นาทีถัดมา: ดันขึ้นไป 100 คน
    { duration: '30s', target: 200 }, // พีคสุด 30 วินาที: 200 คนพร้อมกัน
    { duration: '30s', target: 0 },   // 30 วินาทีสุดท้าย: ค่อยๆ ผ่อนโหลดลง
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Error ต้องไม่เกิน 1%
    http_req_duration: ['p(95)<800'], // 95% ของ Request ต้องตอบกลับเร็วกว่า 800ms
  },
};

export default function () {
  // เลือกระหว่างยิง Frontend หรือ Backend API
  const url = 'https://upmatch.tcmg.me/';
  
  const res = http.get(url);

  // เช็คว่า Status Code ตอบกลับมาเป็น 200 หรือไม่
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // พัก 1 วินาทีก่อนยิง Request ถัดไป (เหมือนผู้ใช้งานจริงเปิดหน้าค้างไว้)
  sleep(1);
}