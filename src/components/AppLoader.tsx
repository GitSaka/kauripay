"use client";

import { Loader2 } from "lucide-react";

export default function AppLoader() {
  return (
    // 🏢 FOND GRIS PC : Maintient le centrage parfait de la capsule partout
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white animate-fade-in">
      
      {/* Animation du Logo Cauris / Loader Circulaire */}
      <div className="relative flex items-center justify-center">
        {/* Cercle extérieur rotatif */}
        <div className="w-16 h-16 border-4 border-slate-100 border-t-[#34D399] rounded-full animate-spin"></div>
        
        {/* Icône de cadenas centrale fixe pour symboliser l'escrow */}
        <div className="absolute text-[#0A2E1A] font-black text-xl">
          🔒
        </div>
      </div>

      {/* Texte d'attente sécurisant pour l'utilisateur béninois */}
      <h3 className="text-lg font-bold text-[#0A2E1A] mt-6 tracking-tight">
        Kauripay Escrow
      </h3>
      
      <p className="text-xs font-semibold text-slate-400 mt-1 animate-pulse">
        Sécurisation de la connexion en cours...
      </p>

      {/* Mention RGPD / CRIET en bas pour rassurer pendant l'attente */}
      <div className="absolute bottom-10 text-center">
        <p className="text-[10px] font-bold uppercase text-slate-300 tracking-wider">
          Connexion cryptée de bout en bout
        </p>
      </div>

    </div>
  );
}
