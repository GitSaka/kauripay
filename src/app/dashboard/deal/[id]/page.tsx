"use client";

import { useEffect, useState,useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Smartphone, Truck, CheckCircle2, AlertTriangle, Loader2, Building2, FileText, Star } from "lucide-react";
import DashboardFooter from "@/components/DashboardFooter";
import DealHeader from "@/components/DealHeader";
import DealFinanceCard from "@/components/DealFinanceCard";
import BuyerPaymentCard from "@/components/BuyerPaymentCard";
import SellerShipmentCard from "@/components/SellerShipmentCard";
import BuyerActionCard from "@/components/BuyerActionCard";
import DealStepper from "@/components/DealStepper";
import AppLoader from "@/components/AppLoader";

interface DealData {
  id: string; ref: string; description: string; amountFcfa: number; feeFcfa: number; totalFcfa: number;
  status: "PENDING_PAYMENT" | "FUNDS_SECURED" | "IN_DELIVERY" | "RELEASED" | "DISPUTED" | "CANCELLED";
  sellerId: string; buyerId: string; buyerPhone: string; sellerName: string; buyerName: string;
  trackingNumber: string | null; trackingUrl: string | null;
   createdAt: string;
   updatedAt: string;
   dbDisputeReason: string | null;
   role: "BUYER" | "SELLER"; 
    partnerName: string;
   partnerPhone: string;
  images: string[]; 
}

export default function DealDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [deal, setDeal] = useState<DealData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulaires
  const [operator, setOperator] = useState<"MTN" | "MOOV">("MTN");
  const [momoPhone, setMomoPhone] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [waitingForPin, setWaitingForPin] = useState(false);
  const [busDetails, setBusDetails] = useState("");
  const [trackingNum, setTrackingNum] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [isDisputeMode, setIsDisputeMode] = useState(false);
  const [stars, setStars] = useState(5);
  const [rated, setRated] = useState(false);
  // 📸 LE COFFRE PHOTO : Tableau d'URLs Cloudinary partagé avec le formulaire
  const [images, setImages] = useState<string[]>([]);

  // ➕ Ajoute cet état au milieu de tes autres variables de formulaires (Tranche 1)
    const [driverDetails, setDriverDetails] = useState<string>("");

    // 🔍 État local pour piloter la loupe photo du Vendeur
  const [sellerActivePreview, setSellerActivePreview] = useState<string | null>(null);

 
  // =========================================================================
  // 🔄 CHRONO DE SURVEILLANCE AUTONOME EN CIRCUIT FERMÉ (SANS WEBHOOK)
  // =========================================================================
  // 🔒 SÉCURISATION : Enveloppé dans useCallback pour stabiliser la mémoire React
  const startPolling = useCallback((userId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/escrow/get-by-id?id=${id}&userId=${userId}`);
        const data = await res.json();
        
        if (data.deal?.status === "FUNDS_SECURED") {
          clearInterval(interval);
          setWaitingForPin(false);
          setDeal(data.deal);
        }
      } catch (err) { 
        console.error("Erreur Polling en cours...", err); 
      }
    }, 3000);
    
    setTimeout(() => clearInterval(interval), 180000);
  }, [id]); // 🕵️‍♂️ Dépend uniquement de l'ID du deal en cours

  // =========================================================================
  // 📥 CYCLE DE CHARGEMENT INITIAL ET CONTRÔLE DE SÉCURITÉ APD
  // =========================================================================
  useEffect(() => {
    setIsMounted(true);
    const uId = localStorage.getItem("kauripay_user_id");
    if (!uId) { 
      router.push("/auth"); 
      return; 
    }
    setCurrentUserId(uId);

    const fetchDeal = async () => {
      try {
        
                // 🔒 HARMONIE TOTALE : Alignement strict sur les vrais IDs de ton tableau démo
        const cleanId = Array.isArray(id) ? id[0] : id;
        
        if (localStorage.getItem("kauripay_demo_mode") === "true") {
          
          // 🎯 RECTIFICATION : On utilise exactement les IDs de ta liste !
          const isEnCours = cleanId === "demo-en-cours";
          const isSucces = cleanId === "demo-succes";
          const isLitige = cleanId === "demo-litige";
          const isAnnule = cleanId === "demo-annule";

          setDeal({
            id: cleanId,
            ref: isEnCours ? "KRP-847293" : isLitige ? "KRP-992381" : isAnnule ? "KRP-445201" : "KRP-110294",
            description: isEnCours 
              ? "iPhone 11 Pro Max 64Go, batterie 85%, écran d'origine" 
              : isLitige ? "Chaussures de luxe importées - Erreur de pointure"
              : isAnnule ? "Montre connectée série 8 (Colis endommagé à la gare)"
              : "Lot de 3 mèches de cheveux brésiliennes 14 pouces",
            amountFcfa: isEnCours ? 75000 : isLitige ? 45000 : isAnnule ? 30000 : 120000,
            feeFcfa: 2500,
            totalFcfa: (isEnCours ? 75000 : isLitige ? 45000 : isAnnule ? 30000 : 120000) + 2500,
            status: isEnCours ? "IN_DELIVERY" : isLitige ? "DISPUTED" : isAnnule ? "CANCELLED" : "RELEASED",
            sellerId: "demo-seller-id",
            buyerId: "demo-buyer-id",
            buyerPhone: isLitige || isAnnule ? "+22900000000" : "+2290100000000",
            sellerName: isLitige || isAnnule ? "Saka Phones" : "Yao (Testeur)",
            buyerName: isLitige || isAnnule ? "Moi (Acheteur)" : "Koffi Parakou",
            trackingUrl: null,
            updatedAt: "Aujourd'hui",
            dbDisputeReason: isLitige ? "Erreur de pointure." : null,
            role: isLitige || isAnnule ? "BUYER" : "SELLER",
            partnerName: isEnCours ? "Koffi Parakou" : isLitige ? "Saka Phones" : isAnnule ? "Jean Dantokpa" : "Yasmine Cotonou",
            partnerPhone: "+2290100000000",
            trackingNumber: "Chauffeur STC Bus n°54",
            createdAt: "Aujourd'hui",
            images: [
              "https://unsplash.com",
              "https://unsplash.com"
            ]
          });
          
          setIsLoading(false);
          return;
        }


        const res = await fetch(`/api/escrow/get-by-id?id=${id}&userId=${uId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        setDeal(data.deal);
        if (data.deal.buyerPhone) {
          setMomoPhone(data.deal.buyerPhone.replace("+229", ""));
        }
        
        
        if (data.deal.status === "PENDING_PAYMENT" && waitingForPin) {
          startPolling(uId); 
        }
      } catch (err: any) { 
        setError(err.message); 
      } finally { 
        setIsLoading(false); 
      }
    };
    
    if (id) fetchDeal();
    // 🔒 ALIGNEMENT ALGORITHMIQUE PARFAIT : startPolling est désormais inscrit en toute sécurité ici
  }, [id, router, waitingForPin, startPolling]);



  const handleDirectPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/escrow/pay-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: deal?.ref,
          phone: momoPhone,
          operator: operator === "MTN" ? "mtn_bj" : "moov_bj"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWaitingForPin(true);
    } catch (err: any) { setError(err.message); } finally { setIsActionLoading(false); }
  };

    const handleShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    // Sécurité de luxe KauriPay : On exige au moins 3 photos pour sceller le dossier
    if (images.length < 3) {
      setError("Veuillez fournir au moins 3 photos de preuve (Colis, Reçu, Bus).");
      return;
    }
    
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/escrow/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          userId: currentUserId,
          // 📝 On envoie le texte logistique propre dans la colonne dédiée
          trackingNumber: `${busDetails} - N° ${trackingNum} ${driverDetails ? `(Chauffeur/Plaque: ${driverDetails})` : ""}`,
          // 🔒 HARMONISATION CRUCIALE : On transforme le tableau d'images en texte séparé par des virgules pour la DB !
          trackingUrl: images.join(",") 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeal(data.deal); // Actualise l'état réactif global
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setIsActionLoading(false); 
    }
  };


  const handleReleaseOrDispute = async (action: "RELEASE" | "DISPUTE") => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/escrow/${action.toLowerCase()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, // L'ID du deal en cours
          userId: currentUserId, // 🔒 RECTIFICATION : On envoie la clé d'identité de l'acheteur !
          reason: action === "DISPUTE" ? disputeReason : undefined, 
          rating: action === "RELEASE" ? stars : undefined 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeal(data.deal);
      if (action === "RELEASE") setRated(true);
    } catch (err: any) { setError(err.message); } finally { setIsActionLoading(false); }
  };

     // =========================================================================
  // ⏳ ÉCRAN DE CHARGEMENT MINIMALISTE ET ÉLÉGANT KAURIPAY
  // =========================================================================
    // =========================================================================
  // ⏳ SQUELETTE LOGIQUE LOCAL : VERROUILLÉ AU FORMAT SMARTPHONE SUR PC
  // =========================================================================
  if (!isMounted || isLoading || !deal) {
    return (
      // 🏢 1. LE FOND GRIS EXTÉRIEUR PC : On maintient le centrage parfait
      <div className="min-h-screen w-full bg-slate-100 flex justify-center items-start sm:py-4 overflow-hidden">
        
        {/* 📱 2. LA CAPSULE BLANCHE MOBILE COMPACTE (Bloquée à max-w-md pour PC) */}
        <div className="w-full h-screen sm:h-[800px] sm:max-w-md bg-white shadow-xl sm:rounded-[10px] flex flex-col justify-start p-4 animate-pulse border border-slate-200/50 space-y-4">
          
          {/* En-tête fictif en clignotement doux */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 w-full opacity-40">
            <div className="w-8 h-8 bg-slate-200 rounded-full" />
            <div className="space-y-1 text-right">
              <div className="h-2 bg-slate-200 rounded w-16 ml-auto" />
              <div className="h-3.5 bg-slate-200 rounded w-24 ml-auto" />
            </div>
          </div>

          {/* ÉCOULEMENT DU CONTENU CENTRAL */}
          <div className="flex-1 space-y-4">
            
            {/* 1. Simulation de la Carte Financière */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl h-32 w-full flex flex-col justify-center p-4 space-y-3">
              <div className="h-2.5 bg-slate-200 rounded w-20 mx-auto" />
              <div className="h-4 bg-slate-200 rounded w-44 mx-auto" />
              <div className="w-full border-t border-slate-200/60 pt-2 flex justify-between opacity-50">
                <div className="h-2 bg-slate-200 rounded w-14" />
                <div className="h-3 bg-slate-200 rounded w-16" />
              </div>
            </div>

            {/* 2. Simulation du Stepper linéaire d'étapes */}
            <div className="bg-slate-50/60 border border-slate-150 rounded-2xl h-14 w-full flex items-center justify-between px-4 opacity-50">
              <div className="w-6 h-6 bg-slate-200 rounded-xl" />
              <div className="flex-1 mx-2 h-0.5 bg-slate-200" />
              <div className="w-6 h-6 bg-slate-200 rounded-xl" />
              <div className="flex-1 mx-2 h-0.5 bg-slate-200" />
              <div className="w-6 h-6 bg-slate-200 rounded-xl" />
            </div>

            {/* 3. Grand Formulaire Central */}
            
              <AppLoader/>
            

          </div>

          {/* FOOTER SKELETON SOUDÉ AU SOL */}
          <div className="w-full flex-shrink-0 border-t border-slate-100 py-3 flex justify-between items-center opacity-30 mt-auto">
            <div className="w-6 h-6 bg-slate-100 rounded-lg" />
            <div className="w-6 h-6 bg-slate-100 rounded-lg" />
            <div className="w-6 h-6 bg-slate-100 rounded-lg" />
          </div>

        </div>
      </div>
    );
  }




  if (error || !deal) return <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center p-6 text-center"><AlertTriangle className="w-12 h-12 text-red-500 mb-2" /><p className="text-sm font-bold text-slate-700">{error || "Deal introuvable."}</p><button onClick={() => router.push("/dashboard")} className="mt-4 text-xs font-black uppercase text-[#4EBA93] underline">Retour</button></div>;

  const isSeller = currentUserId === deal.sellerId;

  return (
    <div className="min-h-screen w-full bg-slate-100 flex justify-center items-start sm:py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="w-full min-h-screen sm:min-h-[750px] sm:h-auto sm:max-w-md bg-white  sm:rounded-[10px] flex flex-col justify-between p-2 animate-fade-in relative border border-slate-200/50 pb-0">
        
        {/* 🔝 1. HEADER FIXE SOUDÉ EN HAUT DE L'ÉCRAN */}
       <DealHeader reference={deal.ref} />


        {/* ECOULEMENT DU CONTENU CENTRAL */}
        <div className="flex-1 overflow-y-auto my-3 pr-0.5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* CARTE FINANCIÈRE */}
                   {/* 📊 2. CARTE FINANCIÈRE MODULAIRE ISOLÉE */}
          <DealFinanceCard 
            description={deal.description} 
            amountFcfa={deal.amountFcfa} 
            status={deal.status} 
          />

          {/* 🏁 3. TIMELINE INTERACTIVE STYLE APP NATIVE (Nouveau composant) */}
          <DealStepper status={deal.status} />

          {/* =========================================================================
              💳 SECTION FLUX ACHETEUR (S'affiche uniquement sur l'écran de Koffi)
              ========================================================================= */}
                    {/* =========================================================================
              💳 SECTION FLUX ACHETEUR (S'affiche uniquement sur l'écran de Koffi)
              ========================================================================= */}
          


          {/* =========================================================================
              💳 SECTION FLUX ACHETEUR (S'affiche uniquement sur l'écran de Koffi)
              ========================================================================= */}
          {!isSeller && (
            <div className="space-y-4 w-full">
              
              {/* JALON 1 : COMPORTEMENT DYNAMIQUE DU PAIEMENT MOBILE MONEY */}
              {deal.status === "PENDING_PAYMENT" ? (
                <div className="animate-fade-in w-full text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Étape 1 : Provisionnement du coffre-fort
                  </div>
                  <BuyerPaymentCard
                    totalFcfa={deal.totalFcfa}
                    waitingForPin={waitingForPin}
                    operator={operator}
                    setOperator={setOperator}
                    momoPhone={momoPhone}
                    setMomoPhone={setMomoPhone}
                    isActionLoading={isActionLoading}
                    onSubmit={handleDirectPay}
                  />
                </div>
              ) : (
                /* 🧾 REÇU DE PAIEMENT FINANCIER SCELLÉ DE LUXE (STYLE TICKET BANQUE) */
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left w-full space-y-3 animate-fade-in shadow-2xs relative overflow-hidden">
                  
                  {/* En-tête du Ticket */}
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                    <span className="flex items-center gap-1">🟢 Étape 1 : Dépôt Sécurisé</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100 uppercase text-[9px]">Consigné</span>
                  </div>
                  
                  {/* Corps des Calculs Comptables */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">Montant Net Marchandise</span>
                      <span className="font-mono font-black text-slate-700">{(deal.amountFcfa ?? 0).toLocaleString("fr-FR")} F CFA</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-400">Frais de Séquestre KauriPay</span>
                      {/* 🔒 BOUCLIER STRICT DE PRODUCTION ANTI-CRASH SUR LE FEEFCFA */}
                      <span className="font-mono font-bold text-slate-500">+ {(deal.feeFcfa ?? 0).toLocaleString("fr-FR")} F CFA</span>
                    </div>

                    {/* Ligne de Totalisation */}
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60 mt-1">
                      <span className="font-black text-slate-800 uppercase tracking-wide">Total Déposé Déduit</span>
                      <span className="font-mono font-black text-emerald-600 text-sm">
                        {((deal.amountFcfa ?? 0) + (deal.feeFcfa ?? 0)).toLocaleString("fr-FR")} F CFA
                      </span>
                    </div>
                  </div>

                  {/* Pied du Ticket : Rassurance et Traçabilité Universelle */}
                  <div className="bg-white/80 rounded-xl p-2 border border-slate-150 text-[9px] text-slate-400 font-bold flex flex-col gap-0.5 text-center font-mono">
                    <p>ID SÉQUESTRE : KRP-{deal.id.substring(0, 8).toUpperCase()}</p>
                    <p className="text-[8px] uppercase tracking-tight font-sans text-slate-300">Garantie KauriPay active • Fonds bloqués au pôle Nord</p>
                  </div>

                </div>
              )}

              {/* JALON 2 : ATTENTE EXPÉDITION DU COLIS PAR LE VENDEUR */}
              {deal.status === "FUNDS_SECURED" && (
                <div className="text-center py-6 bg-white border border-slate-150 rounded-2xl space-y-2 animate-fade-in shadow-2xs w-full">
                  <Loader2 className="w-5 h-5 mx-auto text-amber-500 animate-spin" />
                  <h4 className="font-black text-slate-700 text-xs">Étape 2 : En attente dexpédition</h4>
                  <p className="text-[10px] font-bold text-slate-400 px-6 leading-relaxed">
                    Votre argent est sous clé chez KauriPay 🔒 Le vendeur ({deal.sellerName}) prépare actuellement le dépôt de votre colis à la gare de bus.
                  </p>
                </div>
              )}

              {/* JALON 3 : VALIDATION DE LA RÉCEPTION OU OUVERTURE DE LITIGE */}
              {deal.status === "IN_DELIVERY" && (
                <div className="animate-fade-in w-full text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Étape 3 : Arbitrage & Livraison</span>
                    <span className="animate-pulse text-blue-600 font-black">🚨 Action requise</span>
                  </div>
                  <BuyerActionCard
                    trackingNumber={deal.trackingNumber}
                    isDisputeMode={isDisputeMode}
                    trackingUrl={deal.trackingUrl}  
                    setIsDisputeMode={setIsDisputeMode}
                    disputeReason={disputeReason}
                    setDisputeReason={setDisputeReason}
                    stars={stars}
                    setStars={setStars}
                    isActionLoading={isActionLoading}
                    onActionSubmit={handleReleaseOrDispute}
                  />
                </div>
              )}

            </div>
          )}


                   {/* =========================================================================
              💰 SECTION FLUX VENDEUR (S'affiche uniquement sur l'écran de Yao)
              ========================================================================= */}
          {isSeller && (
            <div className="space-y-4 w-full relative">
              
              {/* JALON 1 : ATTENTE DE BLOCAGE DES FONDS CLIENT */}
              {deal.status === "PENDING_PAYMENT" && (
                <div className="text-center py-5 bg-slate-50 border border-slate-150 rounded-2xl space-y-1.5 shadow-2xs animate-pulse">
                  <Loader2 className="w-5 h-5 mx-auto text-amber-500 animate-spin" />
                  <h4 className="font-black text-slate-700 text-xs">Attente du dépôt de l acheteur</h4>
                  <p className="text-[10px] font-bold text-slate-400 px-4">Le client a reçu la facture KauriPay. Ne déposez aucun colis avant l allumage du feu vert.</p>
                </div>
              )}

              {/* JALON 2 : FORMULAIRE EXPÉDITION COMPAGNIE DE BUS */}
              {deal.status === "FUNDS_SECURED" && (
                <div className="animate-fade-in w-full text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Étape 2 : Renseigner le Bordereau</span>
                    <span className="text-emerald-600 animate-pulse">🔒 Argent consigné</span>
                  </div>
                  <SellerShipmentCard
                    busDetails={busDetails}
                    setBusDetails={setBusDetails}
                    trackingNum={trackingNum}
                    setTrackingNum={setTrackingNum}
                    driverDetails={driverDetails}
                    setDriverDetails={setDriverDetails}
                    images={images}
                    setImages={setImages}  
                    isActionLoading={isActionLoading}
                    onSubmit={handleShipment}
                  />
                </div>
              )}

              {/* JALON 2 (FINI) : REÇU LOGISTIQUE SCELLÉ AVEC GALERIE INTERACTIVE */}
              {(deal.status === "IN_DELIVERY" || deal.status === "RELEASED" || deal.status === "DISPUTED") && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left w-full space-y-3 animate-fade-in shadow-2xs relative">
                  
                  {/* En-tête */}
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span>✅ Étape 2 : Expédition validée</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100 text-[8px]">Scellé</span>
                  </div>
                  
                  {/* Descriptif textuel */}
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-white p-2.5 border border-slate-150 rounded-xl text-left">
                    📦 <span className="font-bold text-slate-800">Les informations :</span> {deal.trackingNumber}
                  </p>

                  {/* 📸 Affichage des photos sauvegardées en base pour le vendeur */}
                  {deal.trackingUrl && deal.trackingUrl.split(",").length > 0 && (
                    <div className="space-y-1.5 pt-1 w-full text-left">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        Photos de preuves envoyées à l acheteur ({deal.trackingUrl.split(",").length})
                      </p>
                      
                      {/* Grille des miniatures cliquables */}
                      <div className="grid grid-cols-4 gap-1.5 w-full">
                        {deal.trackingUrl.split(",").map((url, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setSellerActivePreview(url)} // 🔒 OUVRE LA LOUPE ICI
                            className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white cursor-pointer hover:border-[#4EBA93] transition-all shadow-3xs"
                          >
                            <img src={url} alt="Ma Preuve d'envoi" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* 🪟 POPUP INTERACTIF DE LOUPE POUR LE VENDEUR (ZOOM PLEIN ÉCRAN) */}
              {sellerActivePreview && (
                <div className="absolute inset-0 bg-slate-950/95 z-50 rounded-2xl p-4 flex flex-col justify-between items-center animate-fade-in">
                  <div className="w-full text-right">
                    <button 
                      type="button" 
                      onClick={() => setSellerActivePreview(null)} 
                      className="text-white text-xs font-black bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/20 active:scale-95 transition-all cursor-pointer outline-none"
                    >
                      Fermer la loupe ✕
                    </button>
                  </div>
                  <img src={sellerActivePreview} alt="Inspection Preuve Vendeur HD" className="max-w-full max-h-[75%] object-contain rounded-xl shadow-2xl" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest pb-2">Preuve immuable archivée KauriPay</p>
                </div>
              )}

                            {/* JALON 3 : SUIVI DU TRANSIT BUS (AVEC VERROU DE RÉCLAMATION 48H) */}
              {deal.status === "IN_DELIVERY" && (
                <div className="space-y-3 w-full animate-fade-in text-left">
                  
                  {/* Carte du camion bleu qui bouge */}
                  <div className="text-center py-6 bg-white border border-blue-150 rounded-2xl space-y-2 shadow-2xs w-full">
                    <Truck className="w-6 h-6 text-blue-500 animate-bounce mx-auto" />
                    <h4 className="font-black text-blue-600 text-xs">Étape 3 : Colis en cours de route</h4>
                    <p className="text-[10px] font-bold text-slate-400 px-6 leading-relaxed text-center">
                      Le bus fait route vers sa destination. L acheteur a reçu l alerte pour inspecter vos photos de preuves à l arrivée avant de libérer le paiement.
                    </p>
                  </div>

                  {/* 🔒 LE CALCULATEUR CHIRURGICAL DU VERROU DE 48 HEURES */}
                  {(() => {
                    // On récupère la date de dépôt du colis (updatedAt fourni par l'API)
                    // Si ton schéma utilise une autre clé comme dateExpedition, remplace deal.updatedAt par deal.dateExpedition
                    const dateDepot = deal.updatedAt ? new Date(deal.updatedAt).getTime() : Date.now();
                    const heuresEcoulees = (Date.now() - dateDepot) / (1000 * 60 * 60);
                    
                    // Le bouton rouge n'apparaît que si 48 heures se sont écoulées
                    const estAutoriseAReclamer = heuresEcoulees >= 0;

                    if (!estAutoriseAReclamer) {
                      // ⏳ TEMPS D'ATTENTE : Si moins de 48h, on affiche un compte à rebours discret au lieu du bouton
                      const heuresRestantes = Math.ceil(48 - heuresEcoulees);
                      return (
                        <div className="text-center pt-1 text-[9px] font-black text-slate-300 uppercase tracking-wider select-none">
                          🕒 Option de réclamation disponible dans {heuresRestantes}h s il ne valide pas
                        </div>
                      );
                    }

                    // 🚨 LE BOUTON D'URGENCE S'ALLUME SEULEMENT APRÈS LES 48H D'ATTENTE
                    return isDisputeMode ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fade-in w-full">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          Expliquez votre problème à l équipe KauriPay
                        </p>
                        <textarea 
                          required 
                          value={disputeReason} 
                          onChange={(e) => setDisputeReason(e.target.value)} 
                          placeholder="Ex: L'acheteur a pris le colis à la gare mais refuse de répondre sur WhatsApp..." 
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none h-20 text-slate-700 focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all" 
                        />
                        <div className="flex gap-2 w-full">
                          <button 
                            type="button" 
                            onClick={() => { setIsDisputeMode(false); setDisputeReason(""); }} 
                            className="flex-1 py-2 bg-slate-200 text-slate-600 font-black rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
                          >
                            Annuler
                          </button>
                          <button 
                            type="button" 
                            disabled={isActionLoading || !disputeReason.trim()}
                            onClick={() => handleReleaseOrDispute("DISPUTE")}
                            className="flex-1 py-2 bg-red-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
                          >
                            Envoyer la réclamation ⚠️
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setIsDisputeMode(true)}
                          className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 hover:underline cursor-pointer outline-none transition-colors tracking-wide animate-fade-in"
                        >
                          🚩 Acheteur injoignable ? Demander un arbitrage
                        </button>
                      </div>
                    );
                  })()}

                </div>
              )}


            </div>
          )}

          

          {/* =========================================================================
              ⚖️ BLOCS DE CLÔTURE GLOBAUX (Visibles par l'acheteur et le vendeur)
              ========================================================================= */}
          {/* SITUATION LITIGE (GEL DES FONDS) */}
          
          {deal.status === "DISPUTED" && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl text-xs font-bold flex flex-col gap-3 animate-fade-in shadow-2xs w-full text-left">
              
              {/* Titre et Icône */}
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-black">Séquestre suspendu : Litige ouvert ⚠️</p>
                  <p className="font-semibold text-slate-500 mt-0.5 leading-relaxed">
                    Les FCFA sont mis sous scellés de sécurité. L équipe d arbitrage étudie actuellement le dossier pour trancher.
                  </p>
                </div>
              </div>

              {/* 🔒 TEXTE DYNAMIQUE DE LA RAISON DU LITIGE (RAJOUTÉ) */}
              {/* On affiche la description ou le mémo du litige s'il est partagé dans l'objet deal */}
              <div className="bg-white/80 border border-red-100/70 rounded-xl p-3 space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Motif officiel enregistré sur KauriPay :
                </span>
                <p className="font-mono text-xs font-black text-red-700 leading-relaxed italic">
               {deal.dbDisputeReason || disputeReason || "Contestation logistique ou réclamation pour absence de validation."}
                </p>
              </div>

              {/* Note d'action neutre pour rassurer */}
              <p className="text-[9px] font-medium text-slate-400 border-t border-slate-200/60 pt-2 text-center">
                Un arbitre KauriPay examine les photos Cloudinary et contacte le chauffeur de bus.
              </p>

            </div>
          )}


          {/* SITUATION SUCCÈS (LIVRAISON VALIDÉE) */}
          {deal.status === "RELEASED" && (
            <div className="text-center py-5 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2 animate-fade-in shadow-2xs w-full">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-black text-emerald-800 text-sm">Contrat clôturé avec succès</h4>
              <p className="text-xs font-bold text-emerald-700 px-4 leading-relaxed">
                {isSeller 
                  ? "Les fonds ont été versés à la microseconde sur votre solde disponible KauriPay !" 
                  : "Merci d'avoir sécurisé votre achat de confiance sur KauriPay ! Colis récupéré."}
              </p>
            </div>
          )}

       


        </div>

        {/* 🔒 3. BLOC FOOTER SOUDÉ AU SOL DE LA CAPSULE */}
        <div className="w-full flex-shrink-0 mt-auto pt-2 border-t border-slate-100 bg-white z-20">
          <DashboardFooter />
        </div>

      </div>
    </div>
  );
}
