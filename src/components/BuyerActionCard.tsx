"use client";

import { useState } from "react";
import { Truck, Star, AlertTriangle, ImageIcon, Eye } from "lucide-react";

interface BuyerActionCardProps {
  trackingNumber: string | null;
  isDisputeMode: boolean;
  setIsDisputeMode: (value: boolean) => void;
  disputeReason: string;
  setDisputeReason: (value: string) => void;
  stars: number;
  trackingUrl: string | null; // 
  setStars: (value: number) => void;
  isActionLoading: boolean;
  onActionSubmit: (action: "RELEASE" | "DISPUTE") => void;
}

export default function BuyerActionCard({
  trackingNumber,
  isDisputeMode,
  setIsDisputeMode,
   trackingUrl,
  disputeReason,
  setDisputeReason,
  stars,
  setStars,
  isActionLoading,
  onActionSubmit,
}: BuyerActionCardProps) {
  // État local pour piloter l'affichage de la photo zoomée en plein écran (Loupe)
  const [activePreview, setActivePreview] = useState<string | null>(null);

  // 🕵️‍♂️ Extraction et découpage chirurgical du pack de preuves logistiques
  const parts = trackingNumber?.split(" || ") || [];
  const textualInfo = parts[0] || "Aucun détail logistique renseigné.";
    const uploadedImages = trackingUrl ? trackingUrl.split(",") : [];

  console.log(uploadedImages)

  return (
    <div className="space-y-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm w-full relative">
      
      {/* 🚚 BANDEAU BORDEREAU LOGISTIQUE */}
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-bold text-blue-800 flex flex-col gap-1 w-full text-left">
        <div className="flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="uppercase font-black tracking-wider">Colis en transit Bus</span>
        </div>
        <p className="font-semibold text-slate-700 font-mono mt-1 bg-white/60 p-2 rounded-xl border border-blue-100/50 leading-relaxed text-xs">
          {textualInfo}
        </p>
      </div>

      {/* 🖼️ GRILLE DE PREUVES PHOTO DESTINÉE À L'ACHETEUR (KOFFI) */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2 text-left w-full">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-[#4EBA93]" />
            Inspecter les {uploadedImages.length} photos de preuves du vendeur
          </p>
          
          {/* Grille des miniatures cliquables */}
          <div className="grid grid-cols-4 gap-2 w-full">
            {uploadedImages.map((url, idx) => (
              <div 
                key={idx} 
                onClick={() => setActivePreview(url)} 
                className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:border-[#4EBA93] transition-all group"
              >
                <img src={url} alt="Preuve d'expédition Kauri" className="w-full h-full object-cover" />
                {/* Voile sombre d'effet survol PC */}
                <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🪟 POPUP INTERACTIF DE LOUPE (ZOOM PLEIN ÉCRAN DE LUXE STYLE FINTECH) */}
      {activePreview && (
        <div className="absolute inset-0 bg-slate-950/95 z-50 rounded-2xl p-4 flex flex-col justify-between items-center animate-fade-in">
          <div className="w-full text-right">
            <button 
              type="button" 
              onClick={() => setActivePreview(null)} 
              className="text-white text-xs font-black bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 active:scale-95 transition-all cursor-pointer outline-none"
            >
              Fermer la loupe ✕
            </button>
          </div>
          <img src={activePreview} alt="Inspection Preuve HD" className="max-w-full max-h-[75%] object-contain rounded-xl shadow-2xl" />
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest pb-2">Contrôle de conformité immuable KauriPay</p>
        </div>
      )}
      
      {isDisputeMode ? (
        /* 🔴 COMPORTEMENT A : FORMULAIRE DE DECLARATION DE CONFLIT (LITIGE) */
        <div className="space-y-3 animate-fade-in w-full text-left">
          <textarea 
            required 
            value={disputeReason} 
            onChange={(e) => setDisputeReason(e.target.value)} 
            placeholder="Expliquez précisément le problème (ex: produit cassé, modèle différent)..." 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none h-20 text-slate-700 focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all" 
          />
          <div className="flex gap-2 w-full">
            <button 
              type="button" 
              onClick={() => { setIsDisputeMode(false); setDisputeReason(""); }} 
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl text-xs transition-colors cursor-pointer outline-none"
            >
              Annuler
            </button>
            <button 
              type="button" 
              disabled={isActionLoading || !disputeReason.trim()}
              onClick={() => onActionSubmit("DISPUTE")} 
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed outline-none"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Déclarer le Litige ⚠️
            </button>
          </div>
        </div>
      ) : (
        /* 🟢 COMPORTEMENT B : NOTATION REPUTATION ET LIBERATION DES FONDS */
        <div className="space-y-4 w-full">
          
          {/* ÉVALUATION COMMERCIAL STARTER DE CONFIANCE */}
          <div className="text-center p-2 border-b border-slate-100 w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Notez la réputation du vendeur</p>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  type="button" 
                  onClick={() => setStars(star)} 
                  className="outline-none border-none bg-transparent cursor-pointer transition-transform active:scale-90"
                >
                  <Star className={`w-5 h-5 transition-all ${star <= stars ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* BOUTONS DECISIONNELS RADICAUX */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <button 
              type="button" 
              onClick={() => setIsDisputeMode(true)} 
              className="py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-black active:scale-95 transition-all cursor-pointer outline-none"
            >
              Signaler un Litige
            </button>
            <button 
              type="button" 
              disabled={isActionLoading}
              onClick={() => onActionSubmit("RELEASE")} 
              className="py-3 bg-[#4EBA93] hover:bg-[#3ca47f] text-white rounded-xl text-xs font-black active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer outline-none disabled:opacity-50"
            >
              Colis Conforme ✅
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
