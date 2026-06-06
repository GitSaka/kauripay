"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck,Check, ArrowRight, Info, AlertCircle, ArrowLeft, Share2 } from "lucide-react";

export default function NewEscrowPage() {
  const router = useRouter();
  
  // 🔀 État du rôle : 'BUYER' par défaut (Koffi), bascule sur 'SELLER' (Yao)
  const [role, setRole] = useState<"BUYER" | "SELLER">("SELLER");
  
  // États du formulaire
  const [partnerPhone, setPartnerPhone] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isReusable, setIsReusable] = useState<boolean>(false);

  
  // États de calcul et d'interface
  const [fee, setFee] = useState<number>(500);
  const [total, setTotal] = useState<number>(500);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // État de succès spécifique au Vendeur pour afficher son lien généré
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // SÉCURITÉ : Vérification de la session locale au chargement
  useEffect(() => {
    const userId = localStorage.getItem("kauripay_user_id");
    if (!userId) {
      router.push("/auth");
    }
  }, [router]);

  // Calculateur transparent en temps réel (3% avec minimum de 500F)
  useEffect(() => {
    const parsedAmount = parseInt(amount, 10);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      const calculatedFee = Math.round(parsedAmount * 0.03);
      const finalFee = calculatedFee < 500 ? 500 : calculatedFee;
      setFee(finalFee);
      setTotal(parsedAmount + finalFee);
    } else {
      setFee(500);
      setTotal(500);
    }
  }, [amount]);

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedLink(null);
    setIsLoading(true); 

    const currentUserId = localStorage.getItem("kauripay_user_id");
    const cleanPhone = partnerPhone.replace(/\s/g, "");

    // 🛡️ CONTROLE DE SURFACE OBLIGATOIRE
    if (!currentUserId) {
      setError("Session expirée. Veuillez vous reconnecter.");
      setIsLoading(false);
      return;
    }

    if (!amount || parseInt(amount, 10) <= 0) {
      setError("Le montant net de l'article est obligatoire.");
      setIsLoading(false);
      return;
    }

    if (!description || !description.trim()) {
      setError("Une description précise est obligatoire.");
      setIsLoading(false);
      return;
    }

     if (!(role === "SELLER" && isReusable) && cleanPhone.length < 8) {
      setError(`Veuillez entrer un numéro WhatsApp de ${role === "BUYER" ? "vendeur" : "acheteur"} valide.`);
      setIsLoading(false);
      return;
    }
    try {
      // 🔀 AIGUILLAGE INTELLIGENT DE L'API SELON LE RÔLE DÉCLARÉ
      if (role === "BUYER") {
        
        // 🔒 SCÉNARIO ACHETEUR : Il crée la transaction exacte en envoyant son rôle
        const response = await fetch("/api/escrow/create-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId: currentUserId, // Reçu comme initiateur
            buyerPhone: `+229${cleanPhone}`, // Téléphone du partenaire vendeur
            amountFcfa: parseInt(amount, 10),
            description: description.trim(),
            // 🔒 CORRECTIF : On envoie le rôle pour redresser les IDs côté API
            role: "BUYER" 
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
        
        // 🚀 PROPULSION FLUIDE : Redirection automatique vers sa propre page de facture publique !
        window.location.href = `/pay/${data.ref}`;

      } else {
        
        // 🔒 SCÉNARIO VENDEUR ADAPTÉ : Envoi de la configuration réutilisable
        const response = await fetch("/api/escrow/create-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId: currentUserId,
            buyerPhone: isReusable ? "MULTIPLE" : `+229${cleanPhone}`,
            amountFcfa: parseInt(amount, 10),
            description: description.trim(),
            isReusable: isReusable,
            // 🔒 CORRECTIF : On transmet le rôle vendeur également
            role: "SELLER" 
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
        
        // On affiche le lien généré sur l'écran sans rediriger Yao
        setGeneratedLink(`${window.location.origin}/pay/${data.ref}`);
        setIsLoading(false);
      }

    } 
      catch (err: any) {
            setError(err.message);
            setIsLoading(false);
          }
  };


  return (
    <div className="flex-1 flex flex-col justify-between p-2 bg-white animate-fade-in min-h-screen">
      
      {/* 🟢 TOP DE CONFIANCE SÉCURISÉ HARMONISÉ */}
      <div className="w-full pb-2 border-b border-slate-100 flex items-center justify-between">
        <button type="button" onClick={() => router.push("/dashboard")} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="text-center flex-1 pr-7">
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Nouveau Séquestre</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">L argent reste bloqué jusquà livraison</p>
        </div>
      </div>

      {/* 🔀 SÉLECTEUR DE RÔLE : COHÉRENCE UX FINTECH */}
      <div className="w-full mt-4 bg-slate-50 p-1 rounded-2xl border border-slate-150 grid grid-cols-2 gap-1">
        
        <button
          type="button"
          onClick={() => { setRole("SELLER"); setError(null); setGeneratedLink(null); }}
          className={`py-2.5 text-xs font-black rounded-xl transition-all ${role === "SELLER" ? "bg-white text-slate-800 shadow-sm border border-slate-100" : "text-slate-400"}`}
        >
          Je suis le Vendeur
        </button>
        <button
          type="button"
          onClick={() => { setRole("BUYER"); setError(null); setGeneratedLink(null); }}
          className={`py-2.5 text-xs font-black rounded-xl transition-all ${role === "BUYER" ? "bg-white text-slate-800 shadow-sm border border-slate-100" : "text-slate-400"}`}
        >
          Je suis l Acheteur
        </button>
      </div>

      {/* 📦 FORMULAIRE STYLE CAPSULE MODULAIRE */}
      <div className="w-full my-auto py-1">
        <div className="bg-slate-50 rounded-3xl p-1 border border-slate-100 shadow-sm">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-[#EF4444] rounded-xl flex items-start gap-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ÉCRAN DE SUCCÈS POUR LE VENDEUR : AFFICHAGE DU LIEN WHATSAPP */}
          {generatedLink ? (
            <div className="text-center py-4 space-y-4 animate-fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-bold text-emerald-800 text-left">
                {"🎉 Votre lien KauriPay a été généré. Envoyez-le à l acheteur sur WhatsApp pour qu'il dépose l'argent dans le coffre-fort."}
              </div>
              
              <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold select-all break-all text-slate-600">
                {generatedLink}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  setCopied(true);
                  // Le bouton redevient normal automatiquement après 2 secondes
                  setTimeout(() => setCopied(false), 2000);
                }}
                disabled={copied}
                className={`w-full font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all duration-300 ${
                  copied 
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-50 animate-scale-up" 
                    : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#34D399] stroke-[3]" />
                    {"Lien copié avec succès !"}
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    {"Copier le lien de facturation"}
                  </>
                )}
              </button>
            </div>
          )
          : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {role === "SELLER" && (
                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 my-2 flex items-start gap-3 animate-fade-in text-left">
                  <input
                    type="checkbox"
                    id="isReusable"
                    checked={isReusable}
                    onChange={(e) => {
                      setIsReusable(e.target.checked);
                      if (e.target.checked) setPartnerPhone(""); // Nettoie le numéro si activé
                    }}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-[#4EBA93] focus:ring-[#34D399] cursor-pointer"
                  />
                  <label htmlFor="isReusable" className="cursor-pointer select-none">
                    <p className="text-xs font-black uppercase text-amber-800 tracking-wide">
                      ⚡ Créer un Lien Réutilisable (Permanent)
                    </p>
                    <p className="text-[10px] font-bold text-amber-600/80 leading-relaxed mt-0.5">
                     Plusieurs acheteurs pourront cliquer sur ce même lien permanent pour payer au même moment.
                    </p>
                  </label>
                </div>
              )}
              
              {/* Le label s'adapte dynamiquement selon le rôle sélectionné */}
                          {/* 📱 CONDITION PARTICULE DU CHAMP NUMÉRO */}
              {!(role === "SELLER" && isReusable) ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    {role === "BUYER" ? "Numéro WhatsApp du Vendeur" : "Numéro WhatsApp de l'Acheteur"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold text-sm select-none">
                      +229
                    </span>
                    <input
                      type="tel"
                      placeholder="01 00 00 00 00"
                      required={!(role === "SELLER" && isReusable)}
                      disabled={isLoading}
                      value={partnerPhone}
                      onChange={(e) => setPartnerPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-16 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#4EBA93] focus:border-transparent transition-all text-gray-600"
                    />
                  </div>
                </div>
              ) : (
                /* Écran intermédiaire neutre qui remplace le numéro */
                <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl p-1 flex items-center gap-1 text-slate-400 text-left animate-fade-in">
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider leading-relaxed">
                    Ce lien sera Universelle.
                  </span>
                </div>
              )}


              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Montant net de l article (F CFA)
                </label>
                <input
                  type="tel"
                  placeholder="Ex: 180000"
                  required
                  disabled={isLoading}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#4EBA93] focus:border-transparent transition-all text-gray-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Description précise de l article
                </label>
                <textarea
                  placeholder="Ex: iPhone 13 Pro 128Go, batterie 88%, écran d'origine sans fissure"
                  required
                  rows={3}
                  disabled={isLoading}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#4EBA93] focus:border-transparent transition-all resize-none text-gray-600"
                />
              </div>

              {/* 📊 CALCULATEUR REPOSANT ET LÉGER */}
              <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200/60 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                  <span>Prix de l article :</span>
                  <span className="text-slate-800">{(parseInt(amount, 10) || 0).toLocaleString("fr-FR")} F</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                  <span className="flex items-center gap-1">
                    Frais de sécurité{" "}
                    <span title="3% du montant (Plancher à 500F)" className="cursor-help">
                      <Info className="w-3 h-3 text-[#4EBA93]" />
                    </span>{" "}
                    :
                  </span>
                  <span className="text-slate-800">{fee.toLocaleString("fr-FR")} F</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    {role === "BUYER" ? "Total à transférer :" : "Total facturé à l'acheteur :"}
                  </span>
                  <span className="text-lg font-black text-slate-800">{total.toLocaleString("fr-FR")} F CFA</span>
                </div>
              </div>

             {/* Bouton de soumission dynamique aligné sur la couleur de la connexion */}
            <button
              type="submit"
              disabled={isLoading || !amount || !description }
               className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3.5 rounded-xl text-base shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading 
                ? "Initialisation..." 
                : role === "BUYER" ? "Sécuriser et Payer" : "Générer le lien de confiance"}
              {!isLoading && <ArrowRight className="w-5 h-5 text-[#34D399]" />} {/* Icône Vert menthe pour le style */}
            </button>

            </form>
          )}

        </div>
      </div>

      {/* 🛡️ MENTION JURIDIQUE DE BAS DE PAGE */}
      <div className="w-full text-center pb-2 text-[9px] text-slate-400 font-medium flex items-center justify-center gap-1 border-t border-slate-150 pt-2">
        <ShieldCheck className="w-3.5 h-3.5 text-[#4EBA93]" />
        Protocole de séquestre numérique Kauripay certifié au Bénin.
      </div>
    </div>
  );
}
