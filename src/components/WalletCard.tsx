"use client";

interface WalletCardProps {
  balance: number;
  escrow: number;
  // 🔒 ALIGNEMENT DES ACTIONS : Le parent pilote l'ouverture et le mode actif (FORM ou HISTORY)
  onWithdrawAction: (mode: "FORM" | "HISTORY") => void;
}

export default function WalletCard({ balance, escrow, onWithdrawAction }: WalletCardProps) {
  return (
    <div className="mt-5 bg-white rounded-3xl p-5 border border-slate-150 shadow-sm relative overflow-hidden w-full flex flex-col gap-5">
      
      {/* 🟢 SECTION HAUTE : Solde Retirable */}
      <div className="flex justify-between items-center gap-4 w-full">
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Solde Disponible (Retirable)</p>
          <p className="text-2xl font-black tracking-tight mt-1 text-slate-800 whitespace-nowrap">
            {balance.toLocaleString("fr-FR")} <span className="text-xs font-bold text-slate-500">F CFA</span>
          </p>
        </div>
        
        {/* Colonne des Boutons d'actions financières */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {/* Bouton Principal : Lancement de virement */}
          <button
            type="button"
            onClick={() => onWithdrawAction("FORM")} // Déclenche le mode formulaire
            disabled={balance === 0}
            className="text-xs font-black bg-[#4EBA93] text-white px-4 py-2.5 rounded-xl shadow-sm hover:bg-[#3ca47f] transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed outline-none active:scale-[0.98] border-none"
          >
            Retirer
          </button>

          {/* 📊 BOUTON LIEN HISTORIQUE DISCRET : Toujours cliquable, même si le solde est à 0 */}
          <button
            type="button"
            onClick={() => onWithdrawAction("HISTORY")} // Déclenche le mode historique direct
            className="text-[9px] font-black uppercase text-[#4EBA93] hover:text-[#3ca47f] bg-transparent border-none outline-none cursor-pointer transition-colors tracking-wide"
          >
            Voir l historique
          </button>
        </div>
      </div>

      {/* 🔒 SECTION BASSE : Solde Escrow Bloqué (En Transit) */}
      <div className="pt-4 border-t border-slate-100 flex justify-between items-center gap-4 w-full bg-slate-50 rounded-2xl p-4 text-left">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Argent en Escrow (Bloqué)</p>
          <p className="text-base font-black text-slate-700 mt-0.5 whitespace-nowrap">
            {escrow.toLocaleString("fr-FR")} <span className="text-xs font-bold text-slate-500">F CFA</span>
          </p>
        </div>
        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-wider flex-shrink-0 whitespace-nowrap">
          🔒 Sécurisé
        </span>
      </div>

    </div>
  );
}
