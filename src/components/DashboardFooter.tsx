"use client";

import { ShieldCheck } from "lucide-react";

export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full text-center py-4 border-t border-slate-100 flex flex-col items-center justify-center gap-1 bg-white mt-auto">
      {/* Badge de réassurance neutre */}
      <div className="flex items-center gap-1.5 text-[10px] font-black text-[#4EBA93] uppercase tracking-wider">
        <ShieldCheck className="w-3.5 h-3.5 text-[#4EBA93]" />
        Fonds protégés par séquestre neutre
      </div>
      
      {/* Copyright discret */}
      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
        &copy; {currentYear} KauriPay Inc. • Version MVP 1.0
      </p>
    </div>
  );
}
