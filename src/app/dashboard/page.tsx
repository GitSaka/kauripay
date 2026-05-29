"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert, 
  Clock, 
  LogOut,
  Smartphone,
  X,
  CheckCircle2,
  Loader2
} from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import WalletCard from "@/components/WalletCard";
import TransactionList from "@/components/TransactionList";
import DashboardFooter from "@/components/DashboardFooter";
import AppLoader from "@/components/AppLoader";
import WithdrawModal from "@/components/WithdrawModal";

interface DashboardData {
  wallet: { balanceFcfa: number; escrowFcfa: number; };
  user: { kycStatus: string; phone: string; };
  transactions: Array<{
    id: string; ref: string; amount: number; description: string;
    status: "PENDING_PAYMENT" | "FUNDS_SECURED" | "IN_DELIVERY" | "RELEASED" | "DISPUTED" | "CANCELLED";
    role: "BUYER" | "SELLER"; partnerName: string; date: string;
  }>;
  withdrawals: Array<{
    id: string;
    amount: number;
    phone: string;
    status: "PENDING" | "SUCCESS" | "REJECTED";
    date: string;
  }>;
  unreadNotificationsCount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  
  // Verrou d'hydratation Next.js
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // États des données
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("...");

  // États pour la gestion du Popup de Retrait
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [withdrawPhone, setWithdrawPhone] = useState<string>("");
  const [useDefaultPhone, setUseDefaultPhone] = useState<boolean>(true);
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
    // 📜 Pilote de la modal de retrait : "FORM" pour retirer, "HISTORY" pour revoir ses virements
  const [withdrawMode, setWithdrawMode] = useState<"FORM" | "HISTORY">("FORM");


  // 🔀 LE PILOTE DU DOUBLE FLUX : Crée la variable activeTab pour les onglets
  const [activeTab, setActiveTab] = useState<"ACHATS" | "VENTES">("VENTES");
  // ⏳ Indicateur de transition instantané pour les boutons du Dashboard
  const [isNavigating, setIsNavigating] = useState<boolean>(false);



  
  useEffect(() => {
    setIsMounted(true);

    const userId = localStorage.getItem("kauripay_user_id");
    if (!userId) {
      router.push("/auth");
      return;
    }
    
    const storedName = localStorage.getItem("kauripay_user_name");
    if (storedName) setUserName(storedName);

    const fetchDashboardData = async () => {
      try {

                // 🔒 LE BOUCLIER DÉMO ENRICHI : Simulation complète sans appel réseau
        if (localStorage.getItem("kauripay_demo_mode") === "true") {
          setData({
            wallet: { balanceFcfa: 155000, escrowFcfa: 75000 },
            user: { kycStatus: "verified", phone: "+22900000000" },
            transactions: [
              {
                id: "demo-en-cours",
                ref: "KRP-847293",
                amount: 75000,
                description: "iPhone 11 Pro Max 64Go, batterie 85%, écran d'origine",
                status: "IN_DELIVERY", // 🚚 EN COURS : Permet de tester le suivi logistique bus
                role: "SELLER",
                partnerName: "Koffi Parakou",
                date: "Aujourd'hui"
              },
              {
                id: "demo-succes",
                ref: "KRP-110294",
                amount: 120000,
                description: "Lot de 3 mèches de cheveux brésiliennes 14 pouces",
                status: "RELEASED", // 🔵 TERMINÉ : Argent déjà versé au solde retirable
                role: "SELLER",
                partnerName: "Yasmine Cotonou",
                date: "Hier"
              },
              {
                id: "demo-litige",
                ref: "KRP-992381",
                amount: 45000,
                description: "Chaussures de luxe importées - Erreur de pointure",
                status: "DISPUTED", // 🟡 EN LITIGE : Fonds gelés, arbitrage en cours
                role: "BUYER",
                partnerName: "Saka Phones",
                date: "24 Mai"
              },
              {
                id: "demo-annule",
                ref: "KRP-445201",
                amount: 30000,
                description: "Montre connectée série 8 (Colis endommagé à la gare)",
                status: "CANCELLED", // ❌ ANNULÉ : Deal annulé, acheteur remboursé
                role: "BUYER",
                partnerName: "Jean Dantokpa",
                date: "20 Mai"
              }
            ],
            withdrawals: [
              {
                id: "withdraw-demo-1",
                amount: 45000,
                phone: "01 61 08 56 84",
                status: "PENDING", // En attente du virement manuel de l'Admin
                date: "25 Mai"
              },
              {
                id: "withdraw-demo-2",
                amount: 60000,
                phone: "01 61 08 56 84",
                status: "SUCCESS", // Historique archivé et payé
                date: "18 Mai"
              }
            ],
            unreadNotificationsCount: 3
          });
          setIsLoading(false);
          return; // 🛑 Arrêt strict du chargement réseau
        }

        const response = await fetch(`/api/dashboard?userId=${userId}`);
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error);
        setData(resData);
        if (resData.user?.phone) {
          setWithdrawPhone(resData.user.phone.replace("+229", ""));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

    const handleLogout = async () => {
        try {
          // 🔒 1. ORDRE AU SERVEUR : On demande à l'API de détruire le cookie sécurisé httpOnly
          await fetch("/api/auth/logout", { method: "POST" });
        } catch (err) {
          console.error("Échec de la destruction réseau de la session :", err);
        } finally {
          // 🧹 2. NETTOYAGE LOCAL : On vide le localStorage du navigateur
          localStorage.clear();

          // 🚀 3. EXPULSION RADICALE : Brise le cache et force le Middleware à re-vérifier
          window.location.href = "/auth";
        }
    };



  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setWithdrawError(null);
    setWithdrawLoading(true);

    const userId = localStorage.getItem("kauripay_user_id");

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amountFcfa: data.wallet.balanceFcfa,
          destinationPhone: useDefaultPhone ? data.user.phone : `+229${withdrawPhone.replace(/\s/g, "")}`
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error);

      setWithdrawSuccess(true);

      const newInstantWithdrawal = {
        id: resData.historyId || Math.random().toString(),
        amount: data.wallet.balanceFcfa,
        phone: useDefaultPhone ? data.user.phone : `+229${withdrawPhone.replace(/\s/g, "")}`,
        status: "PENDING" as const, // Forcé à l'état En cours pour le test
        date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
      };

      setData({
        ...data,
        wallet: { ...data.wallet, balanceFcfa: 0 },
        withdrawals: [newInstantWithdrawal, ...(data.withdrawals || [])]
      });

    } catch (err: any) {
      setWithdrawError(err.message || "Échec du traitement du retrait.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "FUNDS_SECURED":
        return <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">🟢 Sécurisé</span>;
      case "IN_DELIVERY":
        return <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">🚚 En cours</span>;
      case "DISPUTED":
        return <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#EF4444] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">🟡 En litige</span>;
      case "RELEASED":
        return <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">🔵 Terminé</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 text-[11px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">❌ Annulé</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">⏳ En attente</span>;
    }
  };




  if (!isMounted || !data) {
    return (
      // 🏢 FOND GRIS PC : On maintient le centrage parfait dès le chargement
      <div className="min-h-screen w-full bg-slate-100 flex justify-center items-center p-0 sm:p-4 overflow-hidden">
        
        {/* 📱 LA CAPSULE BLANCHE : Même taille et structure que la vraie page pour éviter les sauts visuels */}
        <div className="w-full h-screen sm:h-[800px] sm:max-w-md bg-white shadow-xl sm:rounded-[32px] flex flex-col justify-between p-5 relative overflow-hidden border border-slate-200/50 pb-0">
          
          {/* TOP BAR EN CHARGEMENT */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0 w-full animate-pulse">
            <div className="w-9 h-9 bg-slate-100 rounded-full" />
            <div className="text-right space-y-1">
              <div className="h-2 bg-slate-100 rounded w-16 ml-auto" />
              <div className="h-4 bg-slate-100 rounded w-28 ml-auto" />
            </div>
          </div>

          {/* ZONE CENTRALE : BLOCS LOGICIELS AUGMENTÉS EN TAILLE */}
          <div className="flex-1 my-4 space-y-5 animate-pulse">
            
            {/* 1. Simulation Carte Financière (Taille Augmentée à h-36) */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl h-36 w-full flex flex-col justify-center items-center p-4 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-24" />
              <div className="h-5 bg-slate-200 rounded w-40" />
              <div className="w-full border-t border-slate-200/60 pt-3 flex justify-between">
                <div className="h-3 bg-slate-200 rounded w-16" />
                <div className="h-4 bg-slate-200 rounded w-20" />
              </div>
            </div>

            {/* 2. Simulation du Nouveau Stepper (Ligne de temps) */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl h-16 w-full flex items-center justify-between px-4">
              <div className="w-6 h-6 bg-slate-200 rounded-lg" />
              <div className="w-12 h-1 bg-slate-200 rounded" />
              <div className="w-6 h-6 bg-slate-200 rounded-lg" />
              <div className="w-12 h-1 bg-slate-200 rounded" />
              <div className="w-6 h-6 bg-slate-200 rounded-lg" />
            </div>

            {/* 3. Simulation du Grand Formulaire Central (Taille Augmentée à h-56) */}
           <AppLoader/>

          </div>

          {/* FOOTER EN CHARGEMENT */}
          <div className="w-full flex-shrink-0 border-t border-slate-100 py-3 flex justify-between items-center opacity-40 animate-pulse">
            <div className="w-6 h-6 bg-slate-100 rounded-lg" />
            <div className="w-6 h-6 bg-slate-100 rounded-lg" />
            <div className="w-6 h-6 bg-slate-100 rounded-lg" />
          </div>

        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white min-h-screen">
        <ShieldAlert className="w-12 h-12 text-[#EF4444] mb-3" />
        <p className="text-sm font-bold text-slate-700">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-xs font-black uppercase tracking-wider text-[#4EBA93] underline">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex justify-center items-start sm:py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

      <div className="w-full min-h-screen sm:min-h-[800px] sm:h-[820px] sm:max-w-md bg-white  flex flex-col p-5 animate-fade-in relative overflow-hidden justify-between pb-0 border border-slate-200/50">
      {/* 🔝 1. BARRE SUPÉRIEURE */}
      <DashboardHeader
          userName={userName} 
          unreadCount={data.unreadNotificationsCount} 
          onLogout={handleLogout} 
        />


        {/* 🏦 2. PORTEFEUILLE CAPSULE STYLE SÉCURISÉ */}
               
        <WalletCard
          balance={data.wallet.balanceFcfa} 
          escrow={data.wallet.escrowFcfa} 
          // 🔒 RECTIFICATION STRICTE : On utilise la nouvelle prop typée qui reçoit le mode ("FORM" ou "HISTORY")
          onWithdrawAction={(mode) => {
            setWithdrawMode(mode); // Reçoit proprement "FORM" ou "HISTORY" depuis le composant enfant
            setWithdrawSuccess(false);
            setWithdrawError(null);
            setIsWithdrawOpen(true); // Ouvre la modal au centre de l'écran
          }} 
        />



      {/* ➕ 3. ACTION CRÉATION DE SÉQUESTRE */}
            {/* 🚀 BOUTON DE CRÉATION RÉACTIF (ZÉRO SILENCE PARASITE) */}
      <button 
        disabled={isNavigating}
        onClick={() => {
          setIsNavigating(true); // 🔒 Déclenchement instantané à la microseconde du clic !
          router.push("/dashboard/deal/new");
        }}
        className="mt-5 w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3 rounded-2xl text-base shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer border-none"
      >
        {isNavigating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-[#34D399]" />
            <span>Ouverture du formulaire...</span>
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5 text-[#34D399]" />
            <span>Nouveau paiement</span>
          </>
        )}
      </button>


      {/* 🔀 SELECOTEUR D'ONGLETS DOUBLE FLUX STYLE BINANCE */}
      <div className="mt-6 w-full bg-slate-50 p-1 rounded-xl border border-slate-200 grid grid-cols-2 gap-1">
    
        <button
          type="button"
          onClick={() => setActiveTab("VENTES")}
          className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
            activeTab === "VENTES" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-100" 
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          💰 Mes Ventes
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ACHATS")}
          className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
            activeTab === "ACHATS" 
              ? "bg-white text-slate-800 shadow-sm border border-slate-100" 
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          🛒 Mes Achats
        </button>
       
      </div>


      {/* 📊 4. HISTORIQUE DES TRANSACTIONS INTEGRAL COMPLET */}

      <div className="flex-1 overflow-hidden my-2 w-full">
        <TransactionList
          transactions={data.transactions} 
          activeTab={activeTab} 
          renderStatusBadge={renderStatusBadge} 
        />  
      </div>

             {/* 📑 5. POPUP DE RETRAIT INTERACTIF COMPLET */}
       {/* 🪟 POPUP CENTRALISÉ ET INTERACTIF DE RETRAIT (DÉPORTÉ EN COMPOSANT) */}
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        kycStatus={data.user.kycStatus}
        userName={userName}
        userPhone={data.user.phone}
        balanceFcfa={data.wallet.balanceFcfa}
        withdrawPhone={withdrawPhone}
        setWithdrawPhone={setWithdrawPhone}
        useDefaultPhone={useDefaultPhone}
        setUseDefaultPhone={setUseDefaultPhone}
        withdrawLoading={withdrawLoading}
        withdrawSuccess={withdrawSuccess}
        withdrawError={withdrawError}
        onSubmit={handleWithdrawSubmit}
        withdrawals={data.withdrawals || []}
        withdrawMode={withdrawMode} 
             />


      {/* 🔒 LE FOOTER COMPACT QUI FERME LA CAPSULE PROPREMENT */}
      <div className="w-full flex-shrink-0">
        <DashboardFooter />
      </div>

 </div>

    </div>
  );
}
