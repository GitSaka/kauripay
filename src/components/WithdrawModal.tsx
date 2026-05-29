"use client";

import React from "react";
import { X, ShieldCheck, Smartphone, Wallet, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  kycStatus: string;
  userName: string;
  userPhone: string;
  balanceFcfa: number;
  withdrawPhone: string;
  setWithdrawPhone: (value: string) => void;
  useDefaultPhone: boolean;
  setUseDefaultPhone: (value: boolean) => void;
  withdrawLoading: boolean;
  withdrawSuccess: boolean;
  withdrawError: string | null;
  withdrawals: Array<{
    id: string;
    amount: number;
    phone: string;
    status: "PENDING" | "SUCCESS" | "REJECTED";
    date: string;
  }>;
  withdrawMode: "FORM" | "HISTORY"; 
  onSubmit: (e: React.FormEvent) => void;
}

export default function WithdrawModal({
  isOpen,
  onClose,
  kycStatus,
  userName,
  userPhone,
  balanceFcfa,
  withdrawPhone,
  setWithdrawPhone,
  useDefaultPhone,
  setUseDefaultPhone,
  withdrawLoading,
  withdrawSuccess,
  withdrawError,
  withdrawals,
  withdrawMode, 
  onSubmit,
}: WithdrawModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-xl space-y-4 animate-scale-up border border-slate-100 text-left">
        
        {/* En-tête de la Modal */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h4 className="font-black text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[#4EBA93]" />
            {withdrawMode === "HISTORY" ? "Journal de mes Retraits" : "Demande de retrait direct"}
          </h4>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-100 cursor-pointer border-none outline-none"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        {/* 🛡️ CONDITION 1 : CAS BLOCAGE SÉCURITÉ PROFILE KYC */}
        {kycStatus !== "verified" ? (
          <div className="space-y-4 py-1 text-center w-full animate-fade-in">
            <div className="relative flex items-center justify-center mx-auto mb-2">
              <div className="absolute w-14 h-14 bg-emerald-50 rounded-full border border-emerald-100 animate-pulse opacity-70" />
              <div className="relative w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center shadow-3xs">
                <ShieldCheck className="w-5 h-5 text-[#4EBA93]" />
              </div>
            </div>
            <div className="space-y-1 px-1">
              <h5 className="font-black text-slate-800 text-xs uppercase tracking-wide">Sécurisation de votre compte</h5>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                Pour protéger vos gains contre le vol, KauriPay exige une liaison d identité rapide avant votre tout premier retrait Mobile Money.
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px] font-bold text-slate-500 text-left space-y-1">
              <p className="text-slate-700 font-black">📝 Comment valider en 2 minutes :</p>
              <p>1. Cliquez sur le bouton vert ci-dessous pour ouvrir notre WhatsApp.</p>
              <p>2. Envoyez une photo nette de votre pièce d identité (CIP, CNI ou Passeport).</p>
              <p>3. Notre équipe active vos retraits instantanés immédiatement.</p>
            </div>
            <button 
              type="button"
              onClick={() => {
                const message = encodeURIComponent(`Bonjour KauriPay ! Je suis le commerçant ${userName} (${userPhone}). Je souhaite valider mon identité pour débloquer mes retraits de ventes.`);
                window.open(`https://wa.me{message}`, "_blank");
              }}
              className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3 rounded-xl text-xs active:scale-[0.97] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Activer mes retraits sur WhatsApp
            </button>
          </div>
        ) : withdrawSuccess ? (
          /* 🟢 CONDITION 2 : CAS VIREMENT SUR LE RÉSEAU AVEC SUCCÈS */
          <div className="text-center py-4 space-y-3 animate-fade-in w-full">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-3xs">
              <CheckCircle2 className="w-5 h-5 text-[#4EBA93]" />
            </div>
            <div className="space-y-1">
              <h5 className="font-black text-slate-800 text-xs uppercase">Retrait envoyé avec succès !</h5>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed px-2">
                Le virement de <span className="font-mono text-slate-700 font-black">{balanceFcfa.toLocaleString("fr-FR")} F</span> est en cours. Réception sur votre compte Mobile Money béninois sous 15 minutes.
              </p>
            </div>
            <button type="button" onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer border-none">
              Fermer la fenêtre
            </button>
          </div>
        ) : (
          /* 💳 CONDITION 3 : ZONE ACTIONS CLIENTÈLES (TRI ÉTANCHÉ PAR LE MODE) */
          <div className="space-y-4 w-full animate-fade-in">
            
            {/* 🔒 VERROU CHIRURGICAL : On n'affiche le formulaire QUE si on a cliqué sur "Retirer" (withdrawMode === "FORM") */}
            {withdrawMode === "FORM" ? (
              <form onSubmit={onSubmit} className="space-y-4 w-full animate-fade-in">
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-center shadow-3xs">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Montant total à transférer</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">{balanceFcfa.toLocaleString("fr-FR")} F CFA</p>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Numéro de réception</label>
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => setUseDefaultPhone(true)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${useDefaultPhone ? 'bg-[#0A2E1A] text-white border-[#0A2E1A]' : 'bg-white text-slate-500 border-slate-200'}`}
                    >
                      Mon numéro Kauri
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseDefaultPhone(false)}
                      className={`py-2 px-3 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${!useDefaultPhone ? 'bg-[#0A2E1A] text-white border-[#0A2E1A]' : 'bg-white text-slate-500 border-slate-200'}`}
                    >
                      Autre numéro
                    </button>
                  </div>

                  {!useDefaultPhone ? (
                    <div className="relative animate-slide-up">
                      <span className="absolute left-4 top-3 text-xs text-slate-400 font-mono font-black">+229</span>
                      <input
                        type="tel"
                        required
                        placeholder="01XXXXXXXX"
                        value={withdrawPhone}
                        onChange={(e) => setWithdrawPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 pl-14 text-slate-800 font-bold text-xs outline-none focus:ring-2 focus:ring-[#4EBA93] transition-all"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <span>{userPhone} (Compte Principal Bénin)</span>
                    </div>
                  )}
                </div>

                {withdrawError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-start gap-1.5 text-[11px] font-bold text-left">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{withdrawError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawLoading || balanceFcfa <= 0}
                  className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  {withdrawLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Virement crypté en cours...</span>
                    </>
                  ) : (
                    <span>Confirmer et recevoir l argent</span>
                  )}
                </button>
              </form>
            ) : (
              /* 📊 SI MODE "HISTORY" : ON SQUELETTE UNE PETITE CARTE COMPTABLE NEUTRE SANS BOUTON NI FORMULAIRE */
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl text-left shadow-3xs w-full space-y-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Mon Solde Marchand Actuel</span>
                <p className="text-sm font-mono font-black text-slate-800">{balanceFcfa.toLocaleString("fr-FR")} F CFA</p>
              </div>
            )}

            {/* 📜 LE GRAND FIL CHRONOLOGIQUE DES RETRAITS (TOUJOURS VISIBLE ET RE-SÉCURISÉ) */}
            {withdrawals && withdrawals.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-slate-100 w-full text-left max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  {withdrawMode === "HISTORY" ? "Historique complet de vos virements MoMo" : "Suivi de vos Retraits récents"} ({withdrawals.length})
                </p>
                
                <div className="space-y-1.5 w-full">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 flex items-center justify-between text-xs w-full animate-fade-in">
                      <div className="text-left space-y-0.5">
                        <p className="font-mono font-black text-slate-700">{w.amount.toLocaleString("fr-FR")} F CFA</p>
                        <p className="text-[9px] font-bold text-slate-400">Vers {w.phone} • {w.date}</p>
                      </div>
                      <div>
                        {w.status === "PENDING" && <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">En cours ⏳</span>}
                        {w.status === "SUCCESS" && <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Reçu ✅</span>}
                        {w.status === "REJECTED" && <span className="text-[8px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">Rejeté ✕</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Affichage vide si mode HISTORY activé mais qu'il n'y a aucun retrait enregistré
              withdrawMode === "HISTORY" && (
                <div className="text-center py-8 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-[10px] font-bold text-slate-400 px-4 leading-relaxed w-full">
                  Vous n avez effectué aucun virement vers votre compte MTN/Moov pour le moment.
                </div>
              )
            )}

          </div>
        )}
      </div>
    </div>
  );
}
