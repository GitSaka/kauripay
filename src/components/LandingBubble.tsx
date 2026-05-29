"use client";

import { ShieldCheck, User } from "lucide-react";

interface LandingBubbleProps {
  sender: "CLIENT" | "KAURI";
  text: string;
}

export default function LandingBubble({ sender, text }: LandingBubbleProps) {
  const isKauri = sender === "KAURI";

  return (
    <div className={`flex w-full ${isKauri ? "justify-start" : "justify-end"} animate-fade-in`}>
      <div className={`max-w-[85%] rounded-2xl p-3.5 space-y-1 relative shadow-3xs text-left ${
        isKauri 
          ? "bg-slate-50 border border-slate-150 text-slate-800 rounded-tl-none" 
          : "bg-emerald-50 border border-emerald-100 text-slate-800 rounded-tr-none"
      }`}>
        
        {/* Identifiant de l'interlocuteur */}
        <div className={`flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wide mb-0.5 ${isKauri ? "text-[#4EBA93]" : "text-emerald-700"}`}>
          {isKauri ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
          <span>{isKauri ? "Kauri Shield" : "Doute du Client"}</span>
        </div>

        {/* Texte de la discussion */}
        <p className="text-xs font-semibold leading-relaxed text-slate-700 whitespace-pre-line">{text}</p>
        
        <span className="block text-[7.5px] font-mono font-bold text-right text-slate-300">
          {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
