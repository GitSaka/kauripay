"use client";

import { useState } from "react";
import { Phone, XCircle, CheckCircle, ArrowLeft, ShieldAlert, AlertTriangle, Bus } from "lucide-react";

interface DisputeDeal {
  id: string;
  ref: string;
  description: string;
  amountFcfa: number;
  trackingNumber: string | null;
  seller: { name: string; phone: string };
  buyer: { name: string; phone: string } | null;
  buyerPhone: string;
  dispute: { reason: string } | null;
}

interface AdminDisputesProps {
  disputes: DisputeDeal[];
  resolutionNotes: { [key: string]: string };
  setResolutionNotes: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onArbitrage: (id: string, action: "RESOLVE_SELLER" | "RESOLVE_BUYER") => void;
}

export default function AdminDisputes({
  disputes,
  resolutionNotes,
  setResolutionNotes,
  onArbitrage,
}: AdminDisputesProps) {
  // 🔒 LE CAPTEUR DE SÉLECTION : Stocke le litige en cours d'instruction, sinon null
  const [selectedDispute, setSelectedDispute] = useState<DisputeDeal | null>(null);

  if (disputes.length === 0) {
    return (
      <div className="text-center py-12 text-[10px] font-bold text-slate-400 animate-fade-in w-full">
        🌿 Aucun litige ouvert sur le territoire.
      </div>
    );
  }

  // 📑 VUE MULTI-DOSSIERS A : LA FICHE DE JUGEMENT DÉTAILLÉE D'UN DOSSIER UNIQUE
  if (selectedDispute) {
    // Sécurité : On recharge les données fraîches au cas où le deal aurait bougé
    const deal = disputes.find((d) => d.id === selectedDispute.id) || selectedDispute;

    return (
      <div className="w-full animate-fade-in space-y-4 text-left">
        
        {/* Bouton de retour interne pour réouvrir la liste complète */}
        <button
          type="button"
          onClick={() => setSelectedDispute(null)}
          className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors cursor-pointer bg-transparent border-none outline-none tracking-wide"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retourner à la liste des litiges
        </button>

        {/* Corps de la Fiche d'arbitrage */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 w-full text-left shadow-3xs">
          
          <div className="flex justify-between items-center w-full text-[10px] font-black border-b border-slate-200 pb-2">
            <span className="font-mono text-slate-500 bg-white border px-2 py-0.5 rounded-md">{deal.ref}</span>
            <span className="font-mono text-red-600 text-xs">{deal.amountFcfa.toLocaleString("fr-FR")} F CFA</span>
          </div>

          {deal.description && (
            <div className="space-y-0.5 text-left">
              <span className="text-[8px] font-black text-slate-300 uppercase block">Description de l article :</span>
              <p className="text-[11px] font-bold text-slate-600 leading-tight">{deal.description}</p>
            </div>
          )}

          <div className="p-2.5 bg-white border border-slate-150 rounded-xl text-[10px] flex items-center gap-2 font-bold text-slate-600">
            <Bus className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="truncate">Bus/Chauffeur : <span className="font-mono text-blue-600 underline">{deal.trackingNumber || "Non renseigné"}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
            <div className="bg-white border border-slate-150 rounded-xl p-2.5 space-y-0.5 text-left">
              <p className="text-[8px] font-black text-slate-300 uppercase">Vendeur Accusé</p>
              <p className="text-slate-700 font-black truncate">{deal.seller.name}</p>
              <a href={`tel:${deal.seller.phone}`} className="text-[#4EBA93] flex items-center gap-0.5 mt-1 font-mono text-[9px]"><Phone className="w-3 h-3" /> Appeler</a>
            </div>
            <div className="bg-white border border-slate-150 rounded-xl p-2.5 space-y-0.5 text-left">
              <p className="text-[8px] font-black text-slate-300 uppercase">Acheteur Plaignant</p>
              <p className="text-slate-700 font-black truncate">{deal.buyer?.name || "Invité"}</p>
              <a href={`tel:${deal.buyerPhone}`} className="text-[#4EBA93] flex items-center gap-0.5 mt-1 font-mono text-[9px]"><Phone className="w-3 h-3" /> Appeler</a>
            </div>
          </div>

          <div className="p-3 bg-red-50 border border-red-100/60 rounded-xl text-left space-y-1">
            <span className="text-[8px] font-black text-red-400 uppercase tracking-wider block">Motif du conflit déclaré :</span>
            <p className="text-[11px] font-semibold text-red-800 leading-relaxed italic">
              {deal.dispute?.reason || "Contestation logistique générale ou colis non reçu."}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Rédiger le verdict d arbitrage *</label>
            <input 
              type="text"
              required
              placeholder="Ex: Livraison vérifiée avec le chauffeur STC, Yao est payé..."
              value={resolutionNotes[deal.id] || ""}
              onChange={(e) => setResolutionNotes({ ...resolutionNotes, [deal.id]: e.target.value })}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-red-400 shadow-3xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button 
              type="button" 
              onClick={() => { onArbitrage(deal.id, "RESOLVE_BUYER"); setSelectedDispute(null); }} 
              className="py-3 bg-red-600 text-white text-[10px] font-black uppercase rounded-xl cursor-pointer border-none flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" /> Rembourser Koffi
            </button>
            <button 
              type="button" 
              onClick={() => { onArbitrage(deal.id, "RESOLVE_SELLER"); setSelectedDispute(null); }} 
              className="py-3 bg-[#0A2E1A] text-white text-[10px] font-black uppercase rounded-xl cursor-pointer border-none flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Payer le Vendeur
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    /* 📋 VUE MULTI-DOSSIERS B : LA LISTE ÉPURÉE COMPACTE FINTECH (SCALABLE POUR 40 LITIGES) */
    <div className="space-y-1.5 w-full animate-fade-in max-h-[500px] overflow-y-auto pr-0.5 scrollbar-none">
      {disputes.map((deal) => (
        <div
          key={deal.id}
          onClick={() => setSelectedDispute(deal)} // 🔒 LE CLIC INSTANTANÉ TRANSFORME L'ÉCRAN
          className="bg-white border border-slate-150 hover:border-red-200 rounded-2xl p-3 flex items-center justify-between shadow-3xs cursor-pointer active:scale-[0.99] transition-all w-full text-left"
        >
          <div className="space-y-0.5 text-left min-w-0 max-w-[65%]">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border">{deal.ref}</span>
              <span className="text-[8px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse border border-red-100">Conflit</span>
            </div>
            <p className="text-xs font-black text-slate-800 truncate leading-tight mt-1">{deal.description || "Achat Sécurisé"}</p>
            <p className="text-[9px] font-bold text-slate-400 truncate">Vendeur : {deal.seller.name}</p>
          </div>

          <div className="text-right flex flex-col items-end flex-shrink-0">
            <span className="font-mono font-black text-red-600 text-xs">
              {deal.amountFcfa.toLocaleString("fr-FR")} <span className="text-[8px] font-sans">FCFA</span>
            </span>
            <span className="text-[10px] font-black text-[#4EBA93] hover:underline mt-0.5">Instruire ➔</span>
          </div>
        </div>
      ))}
    </div>
  );
}
