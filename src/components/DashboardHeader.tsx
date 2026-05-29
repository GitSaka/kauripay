"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, X, Wallet, PlusCircle, User, LogOut } from "lucide-react";

interface DashboardHeaderProps {
  userName: string;
  unreadCount: number;
  onLogout: () => void;
}

export default function DashboardHeader({ userName, unreadCount, onLogout }: DashboardHeaderProps) {
  const router = useRouter();
  
  // 🔒 État local pour piloter l'ouverture/fermeture du menu rideau
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  return (
    <div className="flex items-center justify-between pb-4 border-b border-slate-100 w-full relative">
      
      {/* ☰ BOUTON BURGER DE LUXE (À GAUCHE) */}
      <button 
        type="button"
        onClick={() => setIsMenuOpen(true)}
        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-100 transition-all cursor-pointer outline-none"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {/* TITRE CENTRAL ÉPURÉ */}
      <div className="text-center flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">KauriPay</p>
        <p className="text-sm font-black text-slate-800">Tableau de bord</p>
      </div>
      
      {/* CLOCHE DE NOTIFICATIONS (À DROITE) */}
      <button 
        type="button"
        className="relative p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-100 transition-all cursor-pointer outline-none"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* =========================================================================
          🖥️ LE MENU RIDEAU COULISSANT (OVERLAY SUPERPOSÉ SANS DÉFORMATION PC)
          ========================================================================= */}
      {isMenuOpen && (
        <div className="absolute inset-x-0 bottom-0 top-0 -mx-5 -mt-5 bg-slate-950/40 backdrop-blur-xs z-50 animate-fade-in flex justify-start h-[780px]">
          
          {/* LE VOLET BLANC */}
          <div className="w-[280px] h-full bg-white shadow-2xl p-5 flex flex-col justify-between animate-slide-right">
            
                       {/* HAUT DU RIDEAU : Profil & Fermeture */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                
                {/* 🔒 L'AVATAR DEVRIENT ENFIN UN BOUTON CLIQUABLE FINTECH */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    // On récupère l'identifiant de session stocké dans ta page pour le propulser sur sa vitrine
                     const uId = localStorage.getItem("kauripay_user_id");
                      if (uId) {
                        router.push(`/seller/${uId}`);
                      } else {
                        router.push("/auth"); // Sécurité : si pas d'ID, on ré-authentifie
                      }
                  }}
                  className="flex items-center gap-3 text-left hover:opacity-85 transition-all outline-none border-none bg-transparent cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0A2E1A] text-white font-black text-sm flex items-center justify-center border shadow-sm uppercase group-hover:scale-95 transition-transform">
                    {userName.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide group-hover:text-[#4EBA93] transition-colors">Voir mon profil ➔</p>
                    <p className="text-xs font-black text-slate-800 truncate max-w-[140px]">{userName}</p>
                  </div>
                </button>

                {/* Bouton Fermer Croix X */}
                <button 
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-100 transition-colors cursor-pointer outline-none"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* 📑 LIENS DE NAVIGATION INTERNES VERTICAUX */}
              <nav className="space-y-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsMenuOpen(false); router.push("/dashboard/wallet"); }} // Aligné sur ta future page portefeuille
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl text-left text-xs font-black text-slate-700 transition-all outline-none cursor-pointer"
                >
                  <Wallet className="w-4 h-4 text-[#4EBA93]" />
                  Mon Portefeuille
                </button>

                <button
                  type="button"
                  onClick={() => { setIsMenuOpen(false); router.push("/dashboard/deal/new"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl text-left text-xs font-black text-slate-700 transition-all outline-none cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-slate-400" />
                  Créer un Séquestre
                </button>

                {/* 🔒 RECTIFICATION : Le bouton de la vitrine appelle enfin la vraie route dynamique */}
                <button
                  type="button"
                  onClick={() => { 
                    setIsMenuOpen(false); 
                     const uId = localStorage.getItem("kauripay_user_id");
                  if (uId) {
                    router.push(`/seller/${uId}`);
                  } else {
                    router.push("/auth"); // Sécurité : si pas d'ID, on ré-authentifie
                  }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl text-left text-xs font-black text-slate-700 transition-all outline-none cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Ma Vitrine Publique
                </button>
              </nav>
            </div>


            {/* BAS DU RIDEAU : Le bouton déconnexion descend en bas pour aérer le design */}
            <button
              type="button"
              onClick={() => { setIsMenuOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-red-50 hover:bg-red-100 text-[#EF4444] rounded-xl text-left text-xs font-black transition-all outline-none border border-red-100/50"
            >
              <LogOut className="w-4 h-4" />
              Déconnecter mon compte
            </button>

          </div>

          {/* CLIC EXTÉRIEUR : Ferme le menu si on clique sur la zone floutée à droite */}
          <div className="flex-1 h-full" onClick={() => setIsMenuOpen(false)} />

        </div>
      )}

    </div>
  );
}
