"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

// ตำแหน่ง ขนาด ความเร็ว และการดีเลย์ของฟองสบู่หัวใจ (เหมือนหน้าแรกทุกประการ)
const floatingHearts = [
  { id: 1, left: "6%", size: 22, delay: 0, duration: 15, color: "text-pink-300/40" },
  { id: 2, left: "14%", size: 16, delay: 4, duration: 18, color: "text-purple-300/35" },
  { id: 3, left: "22%", size: 28, delay: 1.5, duration: 16, color: "text-pink-300/45" },
  { id: 4, left: "32%", size: 18, delay: 6, duration: 14, color: "text-pink-200/50" },
  { id: 5, left: "42%", size: 32, delay: 0.8, duration: 19, color: "text-pink-300/40" },
  { id: 6, left: "52%", size: 15, delay: 3, duration: 13, color: "text-purple-300/30" },
  { id: 7, left: "62%", size: 26, delay: 5.2, duration: 17, color: "text-pink-300/40" },
  { id: 8, left: "72%", size: 20, delay: 2.2, duration: 15, color: "text-pink-300/45" },
  { id: 9, left: "82%", size: 30, delay: 0.3, duration: 20, color: "text-purple-200/40" },
  { id: 10, left: "92%", size: 22, delay: 3.8, duration: 16, color: "text-pink-300/40" },
  { id: 11, left: "18%", size: 20, delay: 7.5, duration: 17, color: "text-pink-200/40" },
  { id: 12, left: "48%", size: 24, delay: 8.5, duration: 15, color: "text-pink-300/35" },
  { id: 13, left: "68%", size: 16, delay: 9.2, duration: 14, color: "text-purple-300/35" },
  { id: 14, left: "88%", size: 24, delay: 6.8, duration: 18, color: "text-pink-300/40" },
];

export default function FloatingHeartsBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none"
    >
      {/* Subtle, tasteful ambient lighting (clean and calm, non-distracting) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-100/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-slate-100/40 rounded-full blur-2xl pointer-events-none" />

      {/* Gentle floating hearts */}
      {mounted &&
        floatingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            className="absolute bottom-[-5%] text-purple-400/20"
            style={{ left: heart.left }}
            animate={{
              y: ["0vh", "-120vh"],
              x: ["0px", "16px", "-16px", "0px"],
              rotate: [0, 15, -15, 0],
              opacity: [0, 0.6, 0.6, 0],
            }}
            transition={{
              duration: heart.duration,
              repeat: Infinity,
              delay: heart.delay,
              ease: "linear",
            }}
          >
            <Heart
              width={heart.size}
              height={heart.size}
              fill="currentColor"
              strokeWidth={0}
            />
          </motion.div>
        ))}
    </div>
  );
}
