"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Award, ArrowRight, RefreshCcw } from "lucide-react";
import LandingHeader from "@/components/LandingHeader";
import LandingBubble from "@/components/LandingBubble";
import TypingIndicator from "@/components/TypingIndicator";
import LandingFooter from "@/components/LandingFooter";
import LandingVFooter from "@/components/LandingVFooter";


interface DialogueStep {
  sender: "CLIENT" | "KAURI";
  text: string;
}

export default function LandingPage() {
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 📝 SCÉNARIO DE L'ACHETEUR (Début automatique)
  const buyerScript: DialogueStep[] = [
    { sender: "KAURI", text: "Je suppose que vous êtes un acheteur qui s'apprête à faire un dépôt MoMo pour un article sur WhatsApp ou Facebook, n'est-ce pas ? 😉" },
    { sender: "CLIENT", text: "Oui c'est exactement ça ! Mais j'ai peur de me faire arnaquer... Si j'envoie mes FCFA en avance et que le vendeur bloque mon numéro ? 😰" },
    { sender: "KAURI", text: "C'est fini ça ! Avec KauriPay, tu bloques l'argent dans notre coffre-fort sécurisé. Le vendeur voit que l'argent est consigné, mais il ne peut pas le toucher tant que tu n'as pas le colis." },
    { sender: "CLIENT", text: "Et si le colis arrive vide à la gare de bus ? Je perds mes sous ?" },
    { sender: "KAURI", text: "Non ! Tu inspectes le colis à la gare. S'il y a un problème, tu cliques sur 'Litige' et tout est gelé. Yao ne touche ses FCFA que si tu valides sur ton écran que tout est conforme ! ✅" },
  ];

  // 📝 SCÉNARIO DU VENDEUR (S'active si Yao se manifeste dans le bloc)
  const sellerScript: DialogueStep[] = [
    { sender: "KAURI", text: "Ah, vous êtes plutôt vendeur ! Autant pour moi. L'algorithme a cru que vous étiez client. Lançons votre protocole de protection des ventes. 💰" },
    { sender: "CLIENT", text: "Moi je vends des téléphones en ligne. Si j'envoie mon colis par le bus à Parakou sans recevoir l'argent d'abord, le client peut prendre la marchandise et fuir ! 📉" },
    { sender: "KAURI", text: "Impossible ici. Avant que tu ne te déplaces à la gare, l'acheteur est obligé de bloquer la totalité de la somme chez KauriPay. Tu reçois une alerte instantanée : 'Feu Vert, Argent Consigné' 🔒." },
    { sender: "CLIENT", text: "Et s'il prend le colis à la gare mais fait le mort sur WhatsApp pour bloquer mes FCFA ?" },
    { sender: "KAURI", text: "Tu enregistres le numéro du chauffeur et ton reçu papier. Si le client fait le mort pendant 48h, tu cliques sur 'Réclamation'. Notre équipe vérifie auprès du bus et te verse tes fonds de force ! ⚖️" },
  ];

  const [visibleMessages, setVisibleMessages] = useState<DialogueStep[]>([]);
  const [scriptMode, setScriptMode] = useState<"BUYER" | "SELLER_RUNNING" | "FINISHED">("BUYER");
  const [localIndex, setLocalIndex] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showEmbeddedButton, setShowEmbeddedButton] = useState<boolean>(false);
  const [showFinalActions, setShowFinalActions] = useState<boolean>(false);

  // Automatisme de lecture du fil Acheteur
  useEffect(() => {
    if (scriptMode === "BUYER" && localIndex < buyerScript.length) {
      setIsTyping(true);
      const delay = buyerScript[localIndex].sender === "CLIENT" ? 1500 : 2200;
      
      const timeout = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages((prev) => [...prev, buyerScript[localIndex]]);
        setLocalIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (scriptMode === "BUYER") {
      setShowEmbeddedButton(true); // Fait surgir l'option directement à l'intérieur du chat
    }
  }, [localIndex, scriptMode]);

  // Automatisme de lecture du fil Vendeur
  useEffect(() => {
    if (scriptMode === "SELLER_RUNNING" && localIndex < sellerScript.length) {
      setIsTyping(true);
      const delay = sellerScript[localIndex].sender === "CLIENT" ? 1500 : 2200;

      const timeout = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages((prev) => [...prev, sellerScript[localIndex]]);
        setLocalIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (scriptMode === "SELLER_RUNNING") {
      setScriptMode("FINISHED");
      setShowFinalActions(true);
    }
  }, [localIndex, scriptMode]);

  // Déclencheur au sein du bloc : Le vendeur répond à Kauri
  const handleSwitchToSeller = () => {
    setShowEmbeddedButton(false);
    setIsTyping(true);

    // Injection de la réponse de Yao dans le flux continu
    setVisibleMessages((prev) => [
      ...prev,
      { sender: "CLIENT", text: "Attends Kauri, moi je ne suis pas acheteur ! Je suis plutôt un vendeur de téléphones qui veut sécuriser ses expéditions. 💰" }
    ]);

    setScriptMode("SELLER_RUNNING");
    setLocalIndex(0);
  };

    // 🔒 SCROLL SÉCURISÉ : Défilement fluide et naturel style WhatsApp
   // 🔒 LE CONTROLEUR DE SCROLL INTERNE STYLE WHATSAPP APP
  useEffect(() => {
    // Si la discussion démarre à peine, on reste sagement scotché en haut pour voir l'en-tête
    if (visibleMessages.length <= 1) return;

    // 🎯 SÉCURISATION : On dit au navigateur d'aligner l'ancrage sur le BAS de la capsule
    // L'argument 'block: "end"' empêche la page de sauter brutalement vers le haut !
    chatEndRef.current?.scrollIntoView({ 
      behavior: "smooth", 
      block: "end" 
    });
  }, [visibleMessages.length, isTyping]);


  return (
    <div className="flex-1 flex flex-col bg-white h-full justify-between p-4 relative w-full overflow-hidden">
      
      <LandingHeader />

      {/* 📜 LE BLOC DE CONVERSATION UNIQUE */}
      <div className="flex-1 overflow-y-auto my-2 pr-0.5 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full pt-2">
        
        {visibleMessages.map((msg, idx) => (
          <LandingBubble key={idx} sender={msg.sender} text={msg.text} />
        ))}

        {isTyping && <TypingIndicator />}

        {/* 🚨 INTEGRATION DIRECTION DANS LE BLOC DE CONVERSATION */}
        {showEmbeddedButton && (
          <div className="w-full flex flex-col gap-2.5 pt-1 pb-2 animate-scale-up text-left max-w-[85%]">
            
          {/* 🔒 RECTIFICATION CHIRURGICALE : Poussé à droite dans le flux style bulle utilisateur */}
            <div className="w-full flex justify-end text-right">
              <button
                type="button"
                onClick={handleSwitchToSeller}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 hover:text-emerald-900 text-[10px] font-black uppercase rounded-2xl rounded-tr-none shadow-3xs transition-all active:scale-95 cursor-pointer outline-none tracking-wide"
              >
                <RefreshCcw className="w-3 h-3 animate-spin [animation-duration:8s] text-emerald-600" />
                  je suis plutôt Vendeur 💰
              </button>
            </div>


            {/* Bouton de conversion final acheteur */}
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.99] border-none cursor-pointer"
            >
              <span>Créer mon compte Acheteur</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        )}

        {/* CLÔTURE ET FIN DE L'HISTOIRE */}
        {(showFinalActions || scriptMode === "FINISHED") && (
          <div className="space-y-4 w-full pt-1 animate-scale-up text-left">
            <button
              onClick={() => router.push("/auth")}
              className="w-full bg-[#0A2E1A] hover:bg-[#123D25] text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.99] border-none cursor-pointer"
            >
              <span>Créer mon compte Vendeur</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            
            
          </div>
        )}

        <LandingFooter />

        <div ref={chatEndRef} />

       

        <LandingVFooter />
      </div>

      <div className="w-full text-center text-[9px] text-slate-300 font-bold flex items-center justify-center gap-1 border-t border-slate-100 pt-2 flex-shrink-0 mt-auto bg-white z-10 select-none">
        <Award className="w-3.5 h-3.5 text-slate-200" />
        <span>Protocole KauriPay Garanti • Certifié conforme CRIET</span>
      </div>

    </div>
  );
}
