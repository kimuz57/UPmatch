"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getSessionSignature } from "@/utils/session";
import { getApiBaseUrl, formatImageUrl } from "@/utils/api";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionSig, setSessionSig] = useState("");

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
        const email = getCookie("upmatch_email");

        const tok = token || email;
        if (tok) {
          setSessionSig(getSessionSignature(tok));
        }

        const baseUrl = getApiBaseUrl();
        const url = email
          ? `${baseUrl}/api/v1/matches?email=${encodeURIComponent(email)}`
          : `${baseUrl}/api/v1/matches`;

        // ยิง API ไปดึงคนที่ Match กันแล้วจาก Backend
        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-User-Email": email || "",
            "Content-Type": "application/json",
          },
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

    const handleMatchEvent = (e) => {
      const { type } = e.detail || {};
      if (type === "match") {
        fetchMatches();
      }
    };
    window.addEventListener("upmatch_notification", handleMatchEvent);
    return () => {
      window.removeEventListener("upmatch_notification", handleMatchEvent);
    };
  }, []);

  return (
    <div className="h-dvh max-h-screen bg-transparent text-slate-800 flex flex-col overflow-hidden">
      <div className="shrink-0 z-30">
        <Navbar />
      </div>
      <main className="flex-1 min-h-0 overflow-y-auto max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-3 sm:py-6 page-bottom-padding">
        <div className="mb-4 sm:mb-6 flex items-center gap-2">
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 fill-pink-500" />
          <h1 className="text-lg sm:text-xl font-black text-slate-800">คนที่ใจตรงกันกับคุณ</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
            <p className="text-sm text-purple-500 font-bold">กำลังโหลดคนที่ใจตรงกัน...</p>
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
                
                <Link href={`/chat/${match.id}${sessionSig ? `?token=${sessionSig}` : ""}`} className="absolute inset-0 flex items-center justify-center bg-purple-900/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
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