"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";

export default function LandingHeader() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0 w-full bg-white z-10">
      {/* Bouton d'action direct à gauche */}
      <button
        type="button"
        onClick={() => router.push("/auth")}
        className="bg-[#4EBA93] hover:bg-[#3ca47f] text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl shadow-sm transition-all active:scale-95 border-none cursor-pointer outline-none flex items-center gap-1"
      >
        <span>Démarrer</span>
        <ArrowRight className="w-3 h-3" />
      </button>

      {/* Le Logo KauriPay au centre */}
      <div className="text-center flex flex-col items-center">
        <h1 className="text-sm font-black text-[#0A2E1A] tracking-widest uppercase">
          KauriPay
        </h1>
        <p className="text-[7.5px] font-black text-slate-300 uppercase tracking-widest -mt-0.5">Escrow Protocol</p>
      </div>

      {/* Témoin crypté à droite */}
      <div className="flex items-center gap-1 bg-slate-50 text-slate-400 border border-slate-150 px-2.5 py-1 rounded-xl text-[8.5px] font-black uppercase tracking-wider select-none">
        <Lock className="w-3 h-3 text-[#4EBA93]" />
        <span>Sécurisé</span>
      </div>
    </div>
  );
}
