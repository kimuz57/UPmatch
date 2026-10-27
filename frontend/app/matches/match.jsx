"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const getCookie = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(';').shift();
          return "";
        };
        const token = getCookie("up_match_token");

        // ยิง API ไปดึงคนที่ Match กันแล้วจาก Backend
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/v1/matches`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        });

        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
        }
      } catch (error) {
        console.error("Failed to fetch matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 text-slate-800 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
          <h1 className="text-xl font-black text-slate-800">คนที่ใจตรงกันกับคุณ</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
            <p className="text-sm text-purple-500 font-bold">กำลังโหลดคนที่ใจตรงกัน...</p>
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {matches.map((match) => (
              <div key={match.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group shadow-md border border-purple-100 bg-white">
                <img src={formatImageUrl(match.image)} alt={match.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {match.online && (
                  <span className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                )}

                <div className="absolute bottom-0 left-0 w-full p-3 text-white">
                  <h3 className="font-bold text-sm truncate">{match.name}, {match.age}</h3>
                  <p className="text-[10px] text-purple-200 truncate">{match.faculty}</p>
                </div>
                
                <Link href={`/chat/${match.id}`} className="absolute inset-0 flex items-center justify-center bg-purple-900/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <div className="bg-white p-3 rounded-full text-purple-600 shadow-lg transform hover:scale-110 transition">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <Heart className="w-8 h-8 text-purple-300" />
            </div>
            <p className="text-slate-500 font-medium text-sm">ยังไม่มีคนที่ใจตรงกัน<br/>ลองไปปัดเพื่อนๆ เพิ่มดูสิ!</p>
          </div>
        )}
      </main>
    </div>
  );
}