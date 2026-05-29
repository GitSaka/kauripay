"use client";

import { Smartphone, Loader2 } from "lucide-react";

interface BuyerPaymentCardProps {
  totalFcfa: number;
  waitingForPin: boolean;
  operator: "MTN" | "MOOV";
  setOperator: (op: "MTN" | "MOOV") => void;
  momoPhone: string;
  setMomoPhone: (phone: string) => void;
  isActionLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BuyerPaymentCard({
  totalFcfa,
  waitingForPin,
  operator,
  setOperator,
  momoPhone,
  setMomoPhone,
  isActionLoading,
  onSubmit,
}: BuyerPaymentCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm w-full">
      {waitingForPin ? (
        /* ⏳ ÉCRAN EN ATTENTE DU PIN SUR LA CARTE SIM */
        <div className="text-center py-4 space-y-3 animate-pulse">
          <Smartphone className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
          <h4 className="font-black text-slate-800 text-sm">Vérifiez votre téléphone</h4>
          <p className="text-xs font-bold text-slate-500 px-2 leading-relaxed">
            Tapez votre code PIN secret pour autoriser le prélèvement de{" "}
            <span className="text-slate-800">{totalFcfa.toLocaleString("fr-FR")} F CFA</span>.
          </p>
        </div>
      ) : (
        /* 💳 FORMULAIRE DE SAISIE ET SELECTION D'OPÉRATEUR */
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOperator("MTN")}
              className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer outline-none ${
                operator === "MTN"
                  ? "bg-amber-400 text-slate-900 border-amber-400 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              MTN MoMo
            </button>
            <button
              type="button"
              onClick={() => setOperator("MOOV")}
              className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer outline-none ${
                operator === "MOOV"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Moov Money
            </button>
          </div>

          <div className="relative">
            <input
              type="tel"
              required
              value={momoPhone}
              onChange={(e) => setMomoPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="Numéro Mobile Money"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#4EBA93] text-slate-700 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isActionLoading || !momoPhone}
            className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isActionLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#34D399]" />
                Envoi du Push USSD...
              </>
            ) : (
              `Déposer ${totalFcfa.toLocaleString("fr-FR")} F CFA`
            )}
          </button>
        </form>
      )}
    </div>
  );
}
