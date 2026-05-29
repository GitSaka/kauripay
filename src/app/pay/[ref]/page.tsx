"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Smartphone, AlertCircle, CheckCircle2, ArrowRight, Loader2, X } from "lucide-react";
import AppLoader from "@/components/AppLoader";

interface PendingDeal {
  id: string; ref: string; description: string; amountFcfa: number; feeFcfa: number; totalFcfa: number; sellerName: string; buyerPhone: string; status: string;
}

export default function PublicPayPage() {
  const { ref } = useParams();
  const router = useRouter();

  const [deal, setDeal] = useState<PendingDeal | null>(null);
  const [buyerPhone, setBuyerPhone] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
    // 🔐 Le gardien du décalage réseau FedaPay / Base de données
  const [isCheckingPayment, setIsCheckingPayment] = useState<boolean>(false);

  
  // 🔒 États pour gérer l'affichage interne du guichet de paiement
  const [waitingForPin, setWaitingForPin] = useState<boolean>(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchDealData = async () => {
      try {
        const response = await fetch(`/api/escrow/get-link?ref=${ref}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setDeal(data.deal);
        if (data.deal.buyerPhone) setBuyerPhone(data.deal.buyerPhone.replace("+229", ""));
      } catch (err: any) {
        setError(err.message || "Lien de paiement invalide.");
      } finally {
        setIsLoading(false);
      }
    };
    if (ref) fetchDealData();
  }, [ref]);

    useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // Si on n'est pas en train de vérifier, on ne fait rien
    if (!isCheckingPayment) return;

    const checkStatusInDatabase = async () => {
      try {
        // Interrogation de ton API de suivi de deal existante
        const response = await fetch(`/api/deal?ref=${ref}`);
        const data = await response.json();

        if (response.ok && data.deal.status === "FUNDS_SECURED") {
          // 🎉 L'ARGENT EST DANS LE COFFRE-FORT ! Ton Webhook a fait son travail
          clearInterval(intervalId);
          setIsCheckingPayment(false);
          
          // Redirection vers ton reçu public (Ex: /pay/success ou dans ta capsule)
          router.push(`/success?ref=${ref}`);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification du statut :", err);
      }
    };

    // Lancement de la boucle : interrogation toutes les 2 secondes
    intervalId = setInterval(checkStatusInDatabase, 2000);

    // Nettoyage de sécurité si l'utilisateur ferme la page
    return () => clearInterval(intervalId);
  }, [isCheckingPayment, ref, router]);


  // Chrono de surveillance automatique en arrière-plan (Polling)
  const verifierStatutPaiement = (reference: string) => {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`/api/escrow/get-link?ref=${reference}`);
      const data = await response.json();
       console.log(data.deal?.status)
      if (data.deal?.status === "FUNDS_SECURED") {
        clearInterval(interval);
        
        // 1. Ferme l'overlay
        setWaitingForPin(false);
        setIsPaying(false);
        
        const cleanPhoneForUrl = data.deal.buyerPhone.replace("+229", "");
  
        router.push(`/success?phone=${cleanPhoneForUrl}&ref=${data.deal.ref}`); 
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, 3000);
  
  // setTimeout(() => clearInterval(interval), 300000); // stop après 5min
};

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPaying(true);

    const cleanPhone = buyerPhone.replace(/\s/g, "");

    try {
      const response = await fetch("/api/escrow/pay-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: ref,
          phone: cleanPhone
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // 🔒 INTERCEPTION : On récupère l'URL et on active l'affichage directement sur la page
      if (data.status === "requires_action" && data.payment_url) {
        setPaymentUrl(data.payment_url);
        setWaitingForPin(true);
        verifierStatutPaiement(ref as string); // Lance l'écoute en arrière-plan
      }

    } catch (err: any) {
      setError(err.message || "Impossible de lancer le paiement.");
      setIsPaying(false);
    }
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center bg-white text-xs font-black text-slate-400 animate-pulse min-h-screen">{"Chargement..."}</div>;
  if (error || !deal) return <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white min-h-screen"><AlertCircle className="w-12 h-12 text-[#EF4444] mb-3" /><p className="text-sm font-bold text-slate-700">{error || "Ce lien n'existe pas."}</p></div>;
    // 🛡️ BARRAGE VISUEL ADAPTÉ (ZÉRO ERREUR TYPESCRIPT)
    if (isCheckingPayment || (isPaying && waitingForPin)){
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white h-full animate-fade-in">
        
        {/* On appelle le loader tout seul, sans lui donner de paramètre 'message' */}
        <AppLoader />
        
        {/* On écrit le texte directement en dessous dans une vraie balise HTML */}
        <p className="text-xs font-black text-[#0A2E1A] uppercase tracking-wide mt-4 animate-pulse">
          Sécurisation des fonds en cours...
        </p>
        
        <p className="text-[10px] font-bold text-slate-400 max-w-[80%] mx-auto mt-1 leading-relaxed">
          KauriPay valide la réception de vos FCFA auprès de MTN/Moov. Veuillez ne pas fermer cette page.
        </p>
        
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-white min-h-screen animate-fade-in relative">
      
      {/* 🖥️ RIDEAU DE PAIEMENT SÉCURISÉ INTÉGRÉ (OVERLAY COMPLET SUR LA PAGE) */}
      {waitingForPin && paymentUrl && (
        <div className="absolute inset-0 bg-slate-900/90 z-50 flex flex-col justify-between p-4 animate-fade-in">
          {/* En-tête du guichet sécurisé interne */}
          <div className="w-full flex items-center justify-between text-white pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#4EBA93] animate-spin" />
              <span className="text-xs font-black uppercase tracking-wider">{"Sécurisation en cours : "}{deal.ref}</span>
            </div>
            <button 
              onClick={() => { setWaitingForPin(false); setIsPaying(false); }}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 📦 L'INTERFACE DIRECTE DE PAIEMENT AFFICHÉE DANS TA PAGE */}
          <div className="w-full h-full max-w-md mx-auto my-auto py-4">
            <div className="w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
              <iframe 
                src={paymentUrl} 
                className="w-full h-full border-0 flex-1" 
                allow="payment"
              />
            </div>
          </div>

          {/* Message de rassurance du bas */}
          <div className="w-full text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2">
            {"🔒 L&apos;argent reste bloqué au chaud sur KauriPay jusqu&apos;à livraison."}
          </div>
        </div>
      )}

      {/* En-tête Principal */}
      <div className="w-full text-center pt-2">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-wider">🛡️ Invitation de paiement sécurisé</div>
        <h1 className="text-xl font-black text-gray-800 tracking-tight mt-3">{"Facture d'Escrow KauriPay"}</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{"Référence : "}{deal.ref}</p>
      </div>

      {/* Formulaire de facturation d'origine */}
      <div className="w-full my-auto py-4 max-w-md mx-auto">
        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          
          <div className="text-center pb-3 border-b border-slate-200/60">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{"Vendeur"}</p>
            <p className="text-base font-black text-slate-800">{deal.sellerName}</p>
            <p className="text-xs font-bold text-slate-500 mt-1 bg-white inline-block px-3 py-1 rounded-xl border border-slate-100">📦 {deal.description}</p>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-100 text-[#EF4444] rounded-xl flex items-start gap-2 text-xs font-bold"><AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span></div>}

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{"Votre numéro Mobile Money (Acheteur)"}</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold text-sm">+229</span>
                <input 
                  type="tel" 
                  placeholder="01 00 00 00 00" 
                  required 
                  disabled={isPaying} 
                  value={buyerPhone} 
                  onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ""))} 
                  className="w-full pl-16 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#4EBA93] text-gray-600 outline-none" 
                />
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/60 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500 font-bold"><span>{"Prix du produit :"}</span><span className="text-slate-800">{deal.amountFcfa.toLocaleString("fr-FR")} F</span></div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-bold"><span>{"Frais de blocage sécurisé :"}</span><span className="text-slate-800">{deal.feeFcfa.toLocaleString("fr-FR")} F</span></div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center"><span className="text-xs font-black text-slate-400 uppercase tracking-wider">{"Total de la transaction :"}</span><span className="text-lg font-black text-slate-800">{deal.totalFcfa.toLocaleString("fr-FR")} F CFA</span></div>
            </div>

            <button type="submit" disabled={isPaying || !buyerPhone} className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3.5 rounded-xl text-base shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
              {isPaying ? "Génération du guichet..." : `Sécuriser les fonds (${deal.totalFcfa.toLocaleString()} F)`}
              {!isPaying && <ArrowRight className="w-5 h-5 text-[#34D399]" />}
            </button>
          </form>

        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center pb-2 text-[9px] text-slate-400 font-medium flex items-center justify-center gap-1 border-t border-slate-100 pt-3">
        <ShieldCheck className="w-3.5 h-3.5 text-[#4EBA93]" />
        {"L&apos;argent reste bloqué de manière neutre par KauriPay."}
      </div>
    </div>
  );
}
