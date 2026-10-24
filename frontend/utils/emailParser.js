// frontend/utils/emailParser.js
export function parseStudentEmail(email) {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return { isValidUpEmail: false, error: 'กรุณากรอกอีเมลนิสิต' };
  }

  if (!cleanEmail.endsWith('@up.ac.th')) {
    return { isValidUpEmail: false, error: 'ต้องใช้อีเมล @up.ac.th ของมหาวิทยาลัยพะเยาเท่านั้น' };
  }

  const studentId = cleanEmail.split('@')[0];

  // รหัสนิสิต ม.พะเยา 8 หลัก
  if (!/^\d{8}$/.test(studentId)) {
    return { isValidUpEmail: false, error: 'รหัสนิสิตต้องเป็นตัวเลข 8 หลัก (เช่น 67021589@up.ac.th)' };
  }

  const entryYearPrefix = parseInt(studentId.substring(0, 2), 10);
  // คำนวณปี พ.ศ. ปัจจุบัน (ถ้ายังไม่ถึงเดือนมิถุนายน ให้นับเป็นปีการศึกษาเดิม)
  const now = new Date();
  const currentThaiYear = now.getFullYear() + 543;
  const academicYearTwoDigits = (now.getMonth() < 5 ? currentThaiYear - 1 : currentThaiYear) % 100;

  let calculatedYear = academicYearTwoDigits - entryYearPrefix + 1;
  if (calculatedYear < 1) calculatedYear = 1;
  if (calculatedYear > 8) calculatedYear = 8;

  return {
    isValidUpEmail: true,
    studentId,
    calculatedYear,
    error: null,
  };
}