"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Star, Award, Calendar, AlertTriangle, ArrowLeft, MessageSquare, UserCheck } from "lucide-react";
import AppLoader from "@/components/AppLoader";

interface Review {
  id: string;
  buyerName: string; // Vrai nom de l'acheteur (ex: Koffi K.)
  stars: number;     // Note exacte de la transaction
  comment: string;   // Vrai texte écrit saisi à la libération
  date: string;
}

interface SellerProfile {
  id: string;
  name: string;
  memberSince: string;
  averageRating: string;
  reviewsCount: number;
  reviews: Review[];
}

export default function SellerPublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/seller/profile?id=${id}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Impossible de charger la vitrine.");
        setSeller(data.seller);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (isLoading) return <AppLoader />;

  if (error || !seller) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-2 flex-shrink-0" />
        <p className="text-sm font-bold text-slate-700">{error || "Profil commerçant introuvable."}</p>
        <button onClick={() => router.push("/dashboard")} className="mt-4 text-xs font-black uppercase text-[#4EBA93] underline cursor-pointer">Retour au tableau de bord</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full justify-between p-4 relative w-full overflow-hidden">
      
      {/* 🔝 1. BARRE SUPÉRIEURE DE NAVIGATION */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-shrink-0 w-full text-left bg-white z-10">
        <button 
          onClick={() => router.back()} 
          className="p-1.5 hover:bg-slate-50 rounded-xl transition-all active:scale-95 outline-none cursor-pointer border-none bg-transparent"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
          Vitrine Certifiée KauriPay
        </span>
        <div className="w-8 h-8 opacity-0" />
      </div>

      {/* 📜 2. FIL FILTRÉ DU LIVRE D'OR COMMERCIAL */}
      <div className="flex-1 overflow-y-auto my-3 pr-0.5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full text-left">
        
        {/* BLOC IDENTITÉ COMMERCIALE */}
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-center space-y-2.5 shadow-3xs w-full">
          <div className="w-12 h-12 bg-[#0A2E1A] text-white font-black text-lg flex items-center justify-center rounded-xl mx-auto shadow-xs uppercase">
            {seller.name.substring(0, 2).toUpperCase()}
          </div>
          
          <div className="space-y-0.5">
            <h1 className="text-lg font-black text-slate-800 tracking-tight">{seller.name}</h1>
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Membre depuis {seller.memberSince}</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-100/70 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider mx-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vendeur de Confiance</span>
          </div>
        </div>

        {/* DOUBLE TABLEAU DE STATS COMPTABLES GLOBALES */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center space-y-0.5 shadow-3xs">
            <span className="text-xl font-mono font-black text-amber-500 flex items-center justify-center gap-0.5">
              {seller.averageRating} <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </span>
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Score Global</span>
          </div>

          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center space-y-0.5 shadow-3xs">
            <span className="text-xl font-mono font-black text-slate-700">
              {seller.reviewsCount}
            </span>
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Transactions Clôturées</span>
          </div>
        </div>

        {/* 📑 LE GRAND FIL DES ÉVALUATIONS VÉRIFIÉES */}
        <div className="space-y-2.5 w-full text-left">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#4EBA93]" />
            Avis vérifiés de la communauté ({seller.reviews.length})
          </h3>

          {seller.reviews.length === 0 ? (
            <div className="text-center py-7 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-[10px] font-bold text-slate-400 px-4">
              Ce commerçant na pas encore reçu de commentaire écrit. Sa note par défaut est bloquée à 5.0/5.
            </div>
          ) : (
            <div className="space-y-2 w-full">
              {seller.reviews.map((review) => (
                <div key={review.id} className="bg-white border border-slate-150 rounded-xl p-3.5 flex flex-col gap-2 shadow-3xs w-full text-left animate-fade-in">
                  
                  {/* Ligne Identité de l'acheteur + Date */}
                  <div className="flex justify-between items-center w-full border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 uppercase">
                        {review.buyerName.substring(0, 1)}
                      </div>
                      <span className="text-xs font-black text-slate-700">{review.buyerName}</span>
                    </div>
                    <span className="text-[8.5px] font-bold text-slate-300 font-mono">{review.date}</span>
                  </div>

                  {/* Ligne Étoiles attribuées */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3 h-3 ${s <= review.stars ? "text-amber-400 fill-amber-400" : "text-slate-100"}`} />
                    ))}
                  </div>

                  {/* Vrai texte saisi par l'acheteur */}
                  <p className="text-[11px] font-semibold text-slate-500 leading-relaxed italic bg-slate-50/60 p-2.5 rounded-xl border border-slate-100/50 text-left">
                     {review.comment}
                  </p>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 🚪 3. PIED DE PAGE FIXE */}
      <div className="w-full text-center text-[9px] text-slate-400 font-bold flex items-center justify-center gap-1 border-t border-slate-100 pt-2 flex-shrink-0 mt-auto bg-white z-10">
        <Award className="w-3.5 h-3.5 text-[#4EBA93]" />
        <span>Garantie KauriPay : Historique immuable de réputation commerciale.</span>
      </div>

    </div>
  );
}
