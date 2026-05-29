"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Eye, EyeOff, User, Smartphone, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  
  // États du formulaire
  const [phone, setPhone] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  
  // États de l'interface
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

    // 🧪 Raccourci magique pour lancer le Mode Démo en un clic
  const handleQuickDemoAccess = () => {
    // 1. On force l'activation du mode bac à sable local
    localStorage.setItem("kauripay_demo_mode", "true");
    localStorage.setItem("kauripay_user_id", "demo-user-id-123");
    localStorage.setItem("kauripay_user_phone", "+22900000000");
    localStorage.setItem("kauripay_user_name", "Yao (Testeur Démo)");
    
    // 2. On scelle le faux cookie de session pour le Middleware serveur
    document.cookie = "kauripay_session_id=demo-session-active; path=/; max-age=3600;";

    // 3. Propulsion immédiate vers le Dashboard sans attente
    router.push("/dashboard");
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanedPhone = phone.replace(/\s/g, "");

    // 🔒 LE BOUCLIER DÉMO : Interception immédiate avant tout contrôle ou appel réseau
    if (cleanedPhone === "00000000" && password === "demo") {
      // 🧪 Activer le mode bac à sable local
      localStorage.setItem("kauripay_demo_mode", "true");
      
      // Injecter les données d'identité démo attendues par ton Dashboard
      localStorage.setItem("kauripay_user_id", "demo-user-id-123");
      localStorage.setItem("kauripay_user_phone", "+22900000000");
      localStorage.setItem("kauripay_user_name", "Yao (Testeur Démo)");
      
      // Créer le cookie de session factice indispensable pour ouvrir le Middleware serveur
      document.cookie = "kauripay_session_id=demo-session-active; path=/; max-age=3600;";

      // Propulsion instantanée sur le Dashboard
      router.push("/dashboard");
      setIsLoading(false);
      return; // 🛑 On coupe net ici, le reste du script est ignoré
    }

    // Validation de surface avant envoi au serveur (Ton code d'origine)
    if (cleanedPhone.length < 8) {
      setError("Le numéro de téléphone entré est trop court.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+229${cleanedPhone}`,
          name: isSignUp ? name : undefined,
          password,
          isSignUp
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      // Sauvegarde des informations de session dans le navigateur pour le MVP
      localStorage.setItem("kauripay_user_id", data.user.id);
      localStorage.setItem("kauripay_user_phone", data.user.phone);
      localStorage.setItem("kauripay_user_name", data.user.name);

      // Redirection automatique interceptée par loading.tsx
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-white animate-fade-in">
      
      {/* 🟢 BANDEAU SUPÉRIEUR DE CONFIANCE */}
      <div className="w-full text-center pt-4">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Cryptage de bout en bout • Certifié BCEAO
        </div>
        <h1 className="text-3xl font-black text-[#0A2E1A] tracking-tight mt-4">
          {isSignUp ? "Créer un compte" : "Se connecter"}
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          {isSignUp 
            ? "Rejoignez Kauripay pour sécuriser vos ventes et achats" 
            : "Accédez à votre espace sécurisé Kauripay"}
        </p>
      </div>

      {/* 📦 FORMULAIRE UNIQUE EN CAPSULE */}
      <div className="w-full my-auto py-4">
        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 shadow-sm">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-[#EF4444] rounded-xl flex items-start gap-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Champ Nom (Affiché uniquement en mode Inscription) */}
            {isSignUp && (
              <div className="animate-fade-in">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Nom complet ou Nom Commercial
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Koffi Koudo"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Champ Numéro de Téléphone WhatsApp */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Numéro WhatsApp
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold text-sm">
                  +229
                </span>
                <input
                  type="tel"
                  placeholder="01 00 00 00 00"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-16 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Champ Mot de Passe */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Mot de passe
                </label>
                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    
                    <input
                    type={showPassword ? "text" : "password"} // 👈 Change dynamiquement le type
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#34D399] focus:border-transparent transition-all"
                    />

                    {/* 👁️ Bouton cliquable pour voir/masquer le mot de passe */}
                    <button
                    type="button" // Important pour ne pas soumettre le formulaire par erreur
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    >
                    {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                    ) : (
                        <Eye className="w-5 h-5" />
                    )}
                    </button>
                </div>
            </div>


            {/* Bouton Principal de Soumission */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3.5 rounded-xl text-base shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading 
                ? "Traitement sécurisé..." 
                : isSignUp ? "Créer mon portefeuille" : "Accéder au tableau de bord"}
            </button>
          </form>

          {/* Sélecteur de Mode (Inscription / Connexion) */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsSignUp(!isSignUp);
              }}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              {isSignUp 
                ? "Déjà un compte ? Connectez-vous" 
                : "Nouveau sur Kauripay ? Créez un compte ici"}
            </button>

            {/* 🧪 LE BOUTON DE PRÉ-REMPLISSAGE DIRECT (RAJOUTÉ) */}
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              className="w-full bg-amber-50 hover:bg-amber-100/80 text-amber-700 border border-amber-200 py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all active:scale-[0.98] cursor-pointer mt-1.5 outline-none flex items-center justify-center gap-1"
            >
              ⚡ Tester l application (Mode Démo)
            </button>
          </div>

        </div>
      </div>

      {/* 📊 SÉCURITÉ COMMERCIALE */}
      <div className="w-full text-center pb-2 border-t border-slate-100 pt-4">
        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
          Enregistrement certifié REPUBLIQUE DU BENIN
        </p>
      </div>

    </div>
  );
}