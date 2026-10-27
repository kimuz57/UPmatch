// frontend/app/matches/page.jsx
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
    <div className="h-dvh max-h-screen bg-transparent text-slate-800 flex flex-col overflow-hidden relative z-10">
      <div className="shrink-0 z-30">
        <Navbar />
      </div>
      <main className="flex-1 min-h-0 overflow-y-auto max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 page-bottom-padding">
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-purple-900 text-purple-900" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">คนที่ใจตรงกัน</h1>
              <p className="text-xs text-slate-500 font-medium">เพื่อนนิสิตที่กดถูกใจคุณและคุณกดถูกใจตอบกลับ</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-800 mb-2" />
            <p className="text-xs text-slate-600 font-semibold">กำลังโหลดคนที่ใจตรงกัน...</p>
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {matches.map((match) => (
              <div key={match.id} className="relative aspect-[3/4] rounded-xl overflow-hidden group shadow-xs border border-slate-200 bg-slate-900">
                <img src={formatImageUrl(match.image)} alt={match.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent" />
                
                {match.online && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></span>
                )}

                <div className="absolute bottom-0 left-0 w-full p-3 text-white">
                  <h3 className="font-bold text-xs truncate">{match.name}, {match.age}</h3>
                  <p className="text-[10px] text-purple-200 truncate">{match.faculty}</p>
                </div>
                
                <Link href={`/chat/${match.id}${sessionSig ? `?token=${sessionSig}` : ""}`} className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white p-3 rounded-full text-purple-900 shadow-xs transform hover:scale-110 transition">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-3 text-purple-800">
              <Heart className="w-7 h-7" />
            </div>
            <p className="text-slate-600 font-medium text-sm">ยังไม่มีคนที่ใจตรงกันในขณะนี้<br/>ลองไปปัดเพื่อนๆ เพิ่มดูสิ</p>
          </div>
        )}
      </main>
    </div>
  );
}