"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Scale, ShieldAlert, ArrowLeft, AlertTriangle } from "lucide-react";
import AppLoader from "@/components/AppLoader";

// Importations chirurgicales de tes nouveaux composants modulaires
import AdminDisputes from "@/components/admin/AdminDisputes";
import AdminWithdrawals from "@/components/admin/AdminWithdrawals";
import AdminUsers from "@/components/admin/AdminUsers";

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

interface PendingWithdrawal {
  id: string;
  amount: number;
  phone: string;
  status: string;
  merchantName: string;
  date: string;
}

interface PlatformUser {
  id: string;
  name: string;
  phone: string;
  kycStatus: string;
  role: string;
  totalSales: number;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // États de l'administration unifiée
  const [disputes, setDisputes] = useState<DisputeDeal[]>([]);
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pilote d'interrupteur des Onglets au format Mobile Capsule
  const [adminTab, setAdminTab] = useState<"LITIGES" | "RETRAITS" | "USERS">("LITIGES");
  const [resolutionNotes, setResolutionNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const adminId = localStorage.getItem("kauripay_user_id");
    if (!adminId) {
      router.push("/auth");
      return;
    }

    const fetchOverviewData = async () => {
      try {
        const res = await fetch(`/api/admin/overview?adminId=${adminId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Accès refusé au panneau d'administration.");
        
        setDisputes(data.disputes || []);
        setWithdrawals(data.withdrawals || []);
        setUsers(data.users || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverviewData();
  }, [router]);

  const handleArbitrage = async (transactionId: string, action: "RESOLVE_SELLER" | "RESOLVE_BUYER") => {
    const adminId = localStorage.getItem("kauripay_user_id");
    const currentNote = resolutionNotes[transactionId] || "Clôture d'arbitrage manuel KauriPay.";

    try {
      const res = await fetch("/api/admin/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, transactionId, action, resolutionNote: currentNote })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDisputes((prev) => prev.filter(d => d.id !== transactionId));
      alert(data.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmWithdrawal = async (historyId: string) => {
    const adminId = localStorage.getItem("kauripay_user_id");
    try {
      const res = await fetch("/api/admin/wallet/confirm-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, historyId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setWithdrawals((prev) => prev.filter(w => w.id !== historyId));
      alert("Retrait validé !");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVerifyUserKyc = async (targetUserId: string) => {
    const adminId = localStorage.getItem("kauripay_user_id");
    try {
      const res = await fetch("/api/admin/users/verify-kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, targetUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers((prev) => prev.map(u => u.id === targetUserId ? { ...u, kycStatus: "verified" } : u));
      alert("KYC Marchand validé !");
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adminTab]);

  if (isLoading) return <AppLoader />;

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white h-full justify-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-2 flex-shrink-0" />
        <p className="text-sm font-bold text-slate-700">{error}</p>
        <button onClick={() => router.push("/dashboard")} className="mt-4 bg-[#0A2E1A] text-white font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer">Retour au Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full justify-between p-4 relative w-full overflow-hidden text-left">
      
      {/* HEADER PANNEAU */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-shrink-0 w-full text-left bg-white z-10">
        <button onClick={() => router.push("/dashboard")} className="p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer border-none bg-transparent">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 select-none">
          <Scale className="w-3.5 h-3.5 text-red-500" />
          Tribunal d Arbitrage
        </span>
        <div className="w-8 h-8 opacity-0" />
      </div>

      {/* SÉLECTEUR D'ONGLETS CAPSULE INTERNE MOBILE */}
      <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl w-full mb-3 flex-shrink-0 select-none">
        <button
          type="button"
          onClick={() => setAdminTab("LITIGES")}
          className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border-none outline-none cursor-pointer ${adminTab === "LITIGES" ? "bg-white text-red-600 shadow-3xs" : "text-slate-400 bg-transparent"}`}
        >
          Litiges ({disputes.length})
        </button>
        <button
          type="button"
          onClick={() => setAdminTab("RETRAITS")}
          className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border-none outline-none cursor-pointer ${adminTab === "RETRAITS" ? "bg-white text-amber-600 shadow-3xs" : "text-slate-400 bg-transparent"}`}
        >
          Retraits ({withdrawals.length})
        </button>
        <button
          type="button"
          onClick={() => setAdminTab("USERS")}
          className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border-none outline-none cursor-pointer ${adminTab === "USERS" ? "bg-white text-emerald-700 shadow-3xs" : "text-slate-400 bg-transparent"}`}
        >
          Comptes ({users.length})
        </button>
      </div>

      {/* ZONE D'AFFICHAGE DÉPORTÉE EN COMPOSANTS FLUIDES */}
      <div className="flex-1 overflow-y-auto my-2 pr-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full pt-1">
        {adminTab === "LITIGES" && (
          <AdminDisputes 
            disputes={disputes} 
            resolutionNotes={resolutionNotes} 
            setResolutionNotes={setResolutionNotes} 
            onArbitrage={handleArbitrage} 
          />
        )}

        {adminTab === "RETRAITS" && (
          <AdminWithdrawals 
            withdrawals={withdrawals} 
            onConfirm={handleConfirmWithdrawal} 
          />
        )}

        {adminTab === "USERS" && (
          <AdminUsers 
            users={users} 
            onVerifyKyc={handleVerifyUserKyc} 
          />
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* PIED DE GARANTIE COMPLIANCE */}
      <div className="w-full text-center text-[9px] text-slate-400 font-bold flex items-center justify-center gap-1 border-t border-slate-100 pt-2 flex-shrink-0 mt-auto bg-white z-10 select-none">
        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        <span>Espace Admin : Décisions tracées et sécurisées.</span>
      </div>

    </div>
  );
}
