"use client";

import { Loader2 } from "lucide-react";

// 📝 Déclaration du contrat de propriétés (Props) acceptées par le composant
interface AppLoaderProps {
  message?: string; // Le point d'interrogation signifie que le message est optionnel
}

export default function AppLoader({ 
  // 🔒 SÉCURITÉ DE SECOURS : Si aucune page ne donne de message, on injecte ce texte par défaut
  message = "Sécurisation de la connexion en cours..." 
}: AppLoaderProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white animate-fade-in min-h-[300px]">
      
      {/* Animation du Logo Cauris / Loader Circulaire */}
      <div className="relative flex items-center justify-center">
        {/* Cercle extérieur rotatif */}
        <div className="w-16 h-16 border-4 border-slate-100 border-t-[#34D399] rounded-full animate-spin"></div>
        
        {/* Icône de cadenas centrale fixe pour symboliser l'escrow */}
        <div className="absolute text-[#0A2E1A] font-black text-xl select-none">
          🔒
        </div>
      </div>

      {/* Texte d'attente sécurisant pour l'utilisateur béninois */}
      <h3 className="text-lg font-bold text-[#0A2E1A] mt-6 tracking-tight select-none">
        Kauripay Escrow
      </h3>
      
      {/* 🔮 TEXTE DYNAMIQUE EXTENSIBLE : S'adapte à la microseconde selon la page */}
      <p className="text-xs font-semibold text-slate-400 mt-1 animate-pulse text-center max-w-[85%] mx-auto leading-relaxed">
        {message}
      </p>

      {/* Mention RGPD / BCEAO en bas pour rassurer pendant l'attente */}
      <div className="mt-8 text-center select-none">
        <p className="text-[10px] font-black uppercase text-slate-300 tracking-wider">
          Connexion cryptée de bout en bout
        </p>
      </div>

    </div>
  );
}
