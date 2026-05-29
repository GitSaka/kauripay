"use client";

import { FileText, HelpCircle, ShieldCheck, Scale, Percent, Landmark, PhoneCall } from "lucide-react";

export default function LandingVFooter() {
  return (
    <div className="pt-5 pb-4 space-y-5 animate-fade-in border-t border-slate-100 mt-5 text-left w-full">
      
      {/* 1. BLOC COMPTABILITÉ : FRAIS DE PLATEFORME */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 flex gap-3 items-start w-full">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 text-[#4EBA93]">
          <Percent className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-left">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Frais fixes transparents</h4>
          <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
            KauriPay prélève une commission fixe de **3% du montant net** de la marchandise (avec un seuil minimum de **500 F CFA**) par dossier [⚙_0]. Les frais sont déduits uniquement lors du retrait des gains du vendeur. Zéro frais caché.
          </p>
        </div>
      </div>

      {/* 2. BLOC LOGISTIQUE : RÈGLES DE SCELLAGE DU SÉQUESTRE */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 flex gap-3 items-start w-full">
        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
          <Scale className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-left">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Protocole d arbitrage strict</h4>
          <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
            Pour valider l expédition, le vendeur a l obligation de charger **3 photos de preuves** (Colis ouvert devant l agent, Reçu papier tamponné de la compagnie, Plaque du bus ou numéro du chauffeur) [⚙_0]. L argent reste bloqué en séquestre tant que l acheteur n a pas validé la conformité à l arrivée.
          </p>
        </div>
      </div>

      {/* 3. BLOC SÉCURITÉ : CONFORMITÉ NATIONALE */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 flex gap-3 items-start w-full">
        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-700">
          <Landmark className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-left">
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Sécurité juridique & Retraits MoMo</h4>
          <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
            KauriPay opère en conformité avec la réglementation en vigueur au Bénin. Tous les comptes marchands font l objet d une liaison d identité (KYC) sur WhatsApp avant le premier transfert vers votre numéro **MTN Mobile Money** ou **Moov Money** [⚙_0].
          </p>
        </div>
      </div>

      {/* 4. LE BOUTON D'URGENCE DU SUPPORT CLIENT */}
      <div className="pt-2 w-full">
        <button
          type="button"
          onClick={() => window.open("https://wa.me", "_blank")} // Remplace par ton numéro support
          className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5 text-[#4EBA93]" />
          Besoin d aide ? Discuter avec un arbitre KauriPay
        </button>
      </div>

    </div>
  );
}
