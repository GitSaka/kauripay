"use client";

import { useEffect, useState } from "react";
import LandingBubble from "@/components/LandingBubble";
import TypingIndicator from "@/components/TypingIndicator";

interface DialogueStep {
  sender: "CLIENT" | "KAURI";
  text: string;
}

interface ScriptSellerProps {
  onFinished: () => void;
}

export default function ScriptSeller({ onFinished }: ScriptSellerProps) {
  const script: DialogueStep[] = [
    { sender: "KAURI", text: "Ah, vous êtes plutôt vendeur ! Autant pour moi. L'algorithme a cru que vous étiez client. Lançons votre protocole de protection des ventes. 💰" },
    { sender: "CLIENT", text: "Moi je vends en ligne. Si j'envoie mon colis par le bus sans recevoir l'argent d'abord, le client peut prendre la marchandise et fuir ! 📉" },
    { sender: "KAURI", text: "Impossible ici. Avant que tu ne te déplaces à la gare, l'acheteur est obligé de bloquer la totalité de la somme chez KauriPay. Tu reçois une alerte instantanée : 'Feu Vert, Argent Consigné' 🔒." },
    { sender: "CLIENT", text: "Et s'il prend le colis à la gare mais fait le mort pour bloquer mes FCFA ?" },
    { sender: "KAURI", text: "Tu enregistres le numéro du chauffeur et ton reçu papier. Si le client fait le mort pendant 48h, tu cliques sur 'Réclamation'. Notre équipe vérifie auprès du bus et te verse tes fonds de force ! ⚖️" },
  ];

  const [visibleMessages, setVisibleMessages] = useState<DialogueStep[]>([]);
  const [index, setIndex] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  useEffect(() => {
    if (index < script.length) {
      setIsTyping(true);
      const delay = script[index].sender === "CLIENT" ? 1500 : 2500;
      const timeout = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages((prev) => [...prev, script[index]]);
        setIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else {
      onFinished();
    }
  }, [index]);

  return (
    <div className="space-y-3.5 w-full">
      {visibleMessages.map((msg, idx) => (
        <LandingBubble key={idx} sender={msg.sender} text={msg.text} />
      ))}
      {isTyping && <TypingIndicator />}
    </div>
  );
}
