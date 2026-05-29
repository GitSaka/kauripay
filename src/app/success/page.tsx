"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import DashboardFooter from "@/components/DashboardFooter";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🕵️‍♂️ Extraction automatique des paramètres injectés par la page de paiement
  const buyerPhone = searchParams.get("phone") || "";
  const dealRef = searchParams.get("ref") || "KRP-XXXXXX";

  // États logiques de l'inscription assistée
  const [hasAccount, setHasAccount] = useState<boolean>(true);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // SÉCURITÉ INITIALE : Le serveur vérifie discrètement si ce numéro possède déjà un compte
  useEffect(() => {
    if (!buyerPhone) return;
    
    const checkAccount = async () => {
      try {
        // 🔒 NETTOYAGE ET SÉCURISATION : On extrait le numéro sans espaces
        const basePhone = buyerPhone.replace(/\s/g, "");
        // On s'assure d'envoyer le format international strict à l'API de contrôle
        const fullPhone = basePhone.startsWith("+229") ? basePhone : `+229${basePhone.replace("+", "")}`;
        
        const res = await fetch(`/api/auth/check-phone?phone=${fullPhone}`);
        const data = await res.json();
        setHasAccount(data.exists); // Passe à false si Koffi n'est pas encore inscrit
      } catch (err) {
        console.error("Erreur contrôle existence compte:", err);
      }
    };
    checkAccount();
  }, [buyerPhone]);

  const handleRegisterAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const basePhone = buyerPhone.replace(/\s/g, "");
    const fullPhone = basePhone.startsWith("+229") ? basePhone : `+229${basePhone.replace("+", "")}`;

    try {
      // 🚀 Action double-effet : On l'inscrit au format international strict (+229)
      const res = await fetch("/api/auth/register-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone, // Format +229 strict aligné sur ta base Neon
          password,
          name: `Acheteur ${fullPhone.substring(4, 8)}`, // Récupère une partie du numéro pour le nom
          ref: dealRef
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'inscription.");

      // On fige instantanément sa nouvelle session locale
      localStorage.setItem("kauripay_user_id", data.user.id);
      localStorage.setItem("kauripay_user_phone", data.user.phone);
      localStorage.setItem("kauripay_user_name", data.user.name);

      // Propulsion directe sur son nouveau tableau de bord avec son onglet Achats actif !
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 🏢 FILET ANTI-DEFORMATION PC : Grand conteneur centré qui protège le design
    <div className="min-h-screen w-full bg-slate-100 flex justify-center items-center p-0 sm:p-4 overflow-hidden">
      
      {/* 📱 FORMAT NATIVE SMARTPHONE PREMIUM OMBRÉ ET SÉCURISÉ */}
      <div className="w-full min-h-screen sm:min-h-[750px] sm:h-auto sm:max-w-md bg-white shadow-xl sm:rounded-[32px] flex flex-col justify-between p-6 animate-fade-in relative">
        
        {/* Écran Blanc Neutre du Haut */}
        <div className="w-full text-center pt-4">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-7 h-7 text-[#4EBA93]" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight mt-3">
            {"Dépôt réussi !"}
          </h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
            {"Fonds sécurisés dans le coffre-fort"}
          </p>
        </div>

        {/* Message de Confiance Central et Formulaire Assisté */}
        <div className="w-full my-auto py-4">
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-center">
            
            <div className="p-4 bg-white rounded-2xl border border-slate-200/60 text-xs font-bold text-slate-600 text-left space-y-1.5 shadow-2xs">
              <p className="font-black text-emerald-600">🟢 Statut : FUNDS_SECURED</p>
              <p className="font-black text-slate-700">🛡️ Garantie KauriPay : Activée</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide border-t border-slate-100 pt-2 mt-2 leading-relaxed">
                {"Le vendeur a reçu l'alerte pour expédier votre colis. L'argent reste bloqué au chaud de manière neutre."}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-[#EF4444] rounded-xl flex items-start gap-2 text-xs font-bold text-left">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 🔒 TEXTE LOGIQUE ASSISTÉE : On s'adapte à l'identité de l'acheteur */}
            {!hasAccount ? (
              <form onSubmit={handleRegisterAndLink} className="space-y-3 pt-2 text-left w-full">
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] font-bold text-amber-800 leading-relaxed">
                  {"👉 Pour suivre votre bus de livraison à la gare et débloquer l'argent au vendeur à la réception, choisissez votre mot de passe secret en 2 secondes."}
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Définir votre mot de passe secret
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#34D399] text-slate-700 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sécurisation de l'espace..." : "Créer mon portefeuille & Suivre mon colis"}
                  {!isLoading && <ArrowRight className="w-4 h-4 text-[#34D399]" />}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/auth")} 
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center cursor-pointer outline-none border border-slate-200/50 mt-1"
                >
                  Créer mon compte plus tard
                </button>
              </form>
            ) : (
              /* CAS B : Koffi a déjà un compte, on lui affiche juste le bouton de retour direct */
              <div className="pt-2 w-full">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {"Accéder au tableau de bord"}
                  <ArrowRight className="w-4 h-4 text-[#34D399]" />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Pied de Page de rassurance légal */}
        <div className="w-full text-center text-[9px] text-slate-400 font-medium flex items-center justify-center gap-1 border-t border-slate-100 pt-3 flex-shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4EBA93]" />
          {"Transaction certifiée et protégée au Bénin."}
        </div>

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 animate-pulse">Initialisation du reçu sécurisé...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
