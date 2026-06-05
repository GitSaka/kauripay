"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Smartphone, AlertCircle, CheckCircle2, ArrowRight, Loader2, X, FileText, Plus, Minus } from "lucide-react";
import AppLoader from "@/components/AppLoader";

interface PendingDeal {
  id: string; ref: string; isReusable: boolean; description: string; amountFcfa: number; feeFcfa: number; totalFcfa: number; sellerName: string; buyerPhone: string; status: string;
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

   // 🔒 NOUVEAUX ÉTATS POUR GÉRER LA QUANTITÉ ET LA NOTE CLIENT (À RAJOUTER)
    const [quantity, setQuantity] = useState<number>(1);
    const [note, setNote] = useState<string>("");
  
     // États de calculs financiers dynamiques pour l'affichage à l'écran
    const [displayAmount, setDisplayAmount] = useState<number>(0);
    const [displayFee, setDisplayFee] = useState<number>(0);
    const [displayTotal, setDisplayTotal] = useState<number>(0);
  

  
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

         if (data.deal.isReusable || data.deal.buyerPhone === "MULTIPLE") {
          setBuyerPhone(""); // Force la case à être vide et propre pour l'acheteur !
        } else if (data.deal.buyerPhone) {
          setBuyerPhone(data.deal.buyerPhone.replace("+229", ""));
        }

        // 🔒 INITIALISATION DES PRIX DYNAMIQUES VISUELS SUR LA PAGE PUBLIQUE
        setDisplayAmount(data.deal.amountFcfa);
        setDisplayFee(data.deal.feeFcfa);
        setDisplayTotal(data.deal.totalFcfa);
      } catch (err: any) {
        setError(err.message || "Lien de paiement invalide.");
      } finally {
        setIsLoading(false);
      }
    };
    if (ref) fetchDealData();
  }, [ref]);

    // 📊 CALCULATRICE DYNAMIQUE KAURIPAY POUR LES LIENS PERMANENTS
  useEffect(() => {
    if (!deal || !deal.isReusable) return;

    // Calcul du sous-total basé sur la quantité choisie par l'acheteur
    const newAmount = deal.amountFcfa * quantity;
    
    // Règle stricte KauriPay : 3% de frais avec plancher obligatoire à 500 F CFA
    const rawFee = Math.round(newAmount * 0.03);
    const newFee = rawFee < 500 ? 500 : rawFee;
    
    const newTotal = newAmount + newFee;

    // Mise à jour instantanée des états d'affichage visuels
    setDisplayAmount(newAmount);
    setDisplayFee(newFee);
    setDisplayTotal(newTotal);
  }, [quantity, deal]);


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


    // 📊 CALCULATRICE AUTOMATIQUE EN TEMPS RÉEL (KAURIPAY SMART ROUTING)
  useEffect(() => {
    // Si le deal n'est pas encore chargé, ou s'il ne s'agit pas d'un lien réutilisable, on stoppe.
    if (!deal || !deal.isReusable) return;

    // 1. Calcul automatique du prix des articles (Prix Unitaire x Quantité)
    const newAmount = deal.amountFcfa * quantity;
    
    // 2. Calcul des frais KauriPay (3% avec respect du plancher strict de 500 F CFA)
    const rawFee = Math.round(newAmount * 0.03);
    const newFee = rawFee < 500 ? 500 : rawFee;
    
    // 3. Calcul du total absolu net
    const newTotal = newAmount + newFee;

    // 4. Injection immédiate dans tes variables d'affichage visuelles
    setDisplayAmount(newAmount);
    setDisplayFee(newFee);
    setDisplayTotal(newTotal);

  }, [quantity, deal]); // 🔄 Le calcul se relance AUTOMATIQUEMENT dès que la quantité ou le deal change !


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
          phone: cleanPhone,
          
          quantity: deal?.isReusable ? quantity : 1,
          note: deal?.isReusable ? note : ""
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

   // 🛡️ BARRAGE VISUEL ADAPTÉ (ZÉRO ERREUR TYPESCRIPT)
   
  if (isCheckingPayment) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col justify-center items-center">
        <AppLoader message="KauriPay valide la réception de vos FCFA auprès de MTN/Moov. Veuillez ne pas fermer cette page." />
      </div>
    );
  }


    // ⏳ ÉCRAN DE CHARGEMENT INTÉGRAL SÉCURISÉ (MODÈLE BRANDING)
    // ⏳ ÉCRAN DE CHARGEMENT COMPTABLE INITIAL (SÉCURISÉ & DYNAMIQUE)
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col justify-center items-center">
        <AppLoader message="KauriPay sécurise la liaison réseau pour vérifier les détails de votre transaction. Veuillez patienter." />
      </div>
    );
  }


  if (error || !deal) return <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white min-h-screen"><AlertCircle className="w-12 h-12 text-[#EF4444] mb-3" /><p className="text-sm font-bold text-slate-700">{error || "Ce lien n'existe pas."}</p></div>;
   

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-white animate-fade-in relative">
      
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

                      {/* 🔒 BLOC COMPTEUR DE QUANTITÉ ET NOTE CLIENT (À coller sous la description) */}
          {deal.isReusable && (
            <div className="space-y-4 pt-2 animate-fade-in text-left">
              
              {/* Le Sélecteur de Quantité Style Panier */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quantité commandée</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">Prix unitaire: {deal.amountFcfa.toLocaleString("fr-FR")} F</p>
                </div>
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border-none cursor-pointer outline-none active:scale-95 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-black text-sm text-slate-800 w-6 text-center select-none">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border-none cursor-pointer outline-none active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* La Zone de Texte Note Client */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#4EBA93]" />
                  Précisions pour le vendeur ( Taille / Couleur / Modèle de fripe )
                </label>
                <textarea
                  placeholder="Ex: La veste en cuir marron taille M et la chemise n°3..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent transition-all resize-none text-slate-700 font-sans"
                />
              </div>

            </div>
          )}


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
              <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                <span>{"Prix du produit :"}</span>
                {/* ✅ RECTIFICATION DYNAMIQUE A */}
                <span className="text-slate-800">{displayAmount.toLocaleString("fr-FR")} F</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                <span>{"Frais de blocage sécurisé :"}</span>
                {/* ✅ RECTIFICATION DYNAMIQUE B */}
                <span className="text-slate-800">{displayFee.toLocaleString("fr-FR")} F</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{"Total de la transaction :"}</span>
                {/* ✅ RECTIFICATION DYNAMIQUE C */}
                <span className="text-lg font-black text-slate-800">{displayTotal.toLocaleString("fr-FR")} F CFA</span>
              </div>
            </div>


            <button type="submit" disabled={isPaying || !buyerPhone} className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3.5 rounded-xl text-base shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
              {isPaying ? "Génération du guichet..." : `Sécuriser les fonds (${displayTotal.toLocaleString("fr-FR")} F)`}
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
