"use client";

import { FileText, HelpCircle, ShieldCheck } from "lucide-react";

export default function LandingFooter() {
  return (
    <div className="pt-5 pb-1 space-y-4 animate-fade-in border-t border-slate-100 mt-5 text-left w-full">
      <div className="space-y-1">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-[#4EBA93]" />
          Conditions d utilisation du séquestre
        </h4>
        <p className="text-[9.5px] font-bold text-slate-400 leading-relaxed">
          En utilisant KauriPay, le vendeur accepte de fournir des photos réelles de preuves de transport à la gare, et l acheteur accepte de provisionner le montant net du colis avant expédition. Les commissions de plateforme (500 F CFA minimum) sont fixes et déduites lors du retrait des fonds.
        </p>
      </div>

      {/* Rassurance Complémentaire Bénin */}
      <div className="grid grid-cols-2 gap-2 text-[9px] font-black text-slate-500 uppercase tracking-wide">
        <div onClick={() => alert("Charte de médiation : Arbitrage sous 24h par KauriPay.")} className="p-2 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Règles Arbitrage</span>
        </div>
        <div onClick={() => alert("Frais de séquestre fixes : 3% par dossier.")} className="p-2 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer hover:bg-slate-100 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4EBA93]" />
          <span>Frais Transparents</span>
        </div>
      </div>
    </div>
  );
}
