"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface DealHeaderProps {
  reference: string;
}

export default function DealHeader({ reference }: DealHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0 w-full bg-white z-30 ">
      
      {/* Bouton Retour à gauche */}
      <button 
        type="button" 
        onClick={() => router.push("/dashboard")} 
        className="p-2 hover:bg-slate-50 rounded-full transition-colors cursor-pointer outline-none"
      >
        <ArrowLeft className="w-5 h-5 text-slate-600" />
      </button>

      {/* Référence du Deal à droite */}
      <div className="text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Référence Deal</p>
        <p className="text-sm font-black text-slate-800">{reference}</p>
      </div>

    </div>
  );
}
