"use client";

import { Check, CheckCircle2, Clock } from "lucide-react";

interface PendingWithdrawal {
  id: string;
  amount: number;
  phone: string;
  status: string; // PENDING ou SUCCESS
  merchantName: string;
  date: string;
}

interface AdminWithdrawalsProps {
  withdrawals: PendingWithdrawal[];
  onConfirm: (id: string) => void;
}

export default function AdminWithdrawals({ withdrawals, onConfirm }: AdminWithdrawalsProps) {
  
  // 🔀 SÉPARATION CHIRURGICALE POUR LE CONTRÔLE TOTAL DE TA TRÉSORERIE
  const pendingItems = withdrawals.filter((w) => w.status === "PENDING");
  const successItems = withdrawals.filter((w) => w.status === "SUCCESS");

  if (withdrawals.length === 0) {
    return (
      <div className="text-center py-12 text-[10px] font-bold text-slate-400 animate-fade-in w-full">
        🌿 Aucun mouvement de retrait enregistré sur la plateforme.
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full animate-fade-in text-left">
      
      {/* =========================================================================
          ⏳ SOUS-SECTION A : LES DEMANDES EN ATTENTE (A ACTIONNER SUR TON TELEPHONE)
          ========================================================================= */}
      <div className="space-y-2">
        <p className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100/70 uppercase tracking-wider inline-flex items-center gap-1 select-none">
          <Clock className="w-3 h-3 animate-pulse" />
          À envoyer par Mobile Money ({pendingItems.length})
        </p>

        {pendingItems.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-[10px] font-bold text-slate-400 px-4 leading-relaxed">
            🎉 Bravo ! Tous les virements MoMo du jour ont été expédiés.
          </div>
        ) : (
          <div className="space-y-2 w-full">
            {pendingItems.map((w) => (
              <div key={w.id} className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-4 w-full shadow-3xs animate-fade-in">
                <div className="space-y-0.5 text-left min-w-0 flex-1">
                  <p className="text-xs font-mono font-black text-slate-800">{w.amount.toLocaleString("fr-FR")} F CFA</p>
                  <p className="text-[10px] font-bold text-slate-700 truncate">Par : {w.merchantName}</p>
                  <p className="text-[9px] font-bold text-slate-400 font-mono">Dest : {w.phone} • {w.date}</p>
                </div>

                <button 
                  type="button"
                  onClick={() => onConfirm(w.id)}
                  className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 flex-shrink-0 border-none outline-none active:scale-95"
                >
                  <Check className="w-3 h-3 text-amber-600" />
                  Envoyé
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          ✅ SOUS-SECTION B : L'HISTORIQUE DES VIREMENTS EFFECTUÉS (LE LIVRE COMPTABLE)
          ========================================================================= */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <p className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase tracking-wider inline-flex items-center gap-1 select-none">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Archives des retraits payés ({successItems.length})
        </p>

        {successItems.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-150 bg-slate-50/20 rounded-xl text-[10px] font-bold text-slate-400 px-4">
            Aucun historique de décaissement archivé pour le moment.
          </div>
        ) : (
          <div className="space-y-1.5 w-full max-h-64 overflow-y-auto pr-0.5 scrollbar-none">
            {successItems.map((w) => (
              <div key={w.id} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 flex items-center justify-between gap-3 w-full opacity-75 text-left animate-fade-in">
                <div className="space-y-0.5 text-left min-w-0 flex-1">
                  <p className="text-[11px] font-mono font-black text-slate-500 line-through">{w.amount.toLocaleString("fr-FR")} F</p>
                  <p className="text-[9px] font-bold text-slate-400 truncate">Bénéficiaire : {w.merchantName}</p>
                  <p className="text-[8.5px] font-bold text-slate-300 font-mono">Vers {w.phone} • {w.date}</p>
                </div>

                <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 select-none">
                  Clôturé ✓
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
