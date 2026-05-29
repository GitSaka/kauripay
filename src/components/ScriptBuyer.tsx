"use client";

import { useEffect, useState } from "react";
import LandingBubble from "@/components/LandingBubble";
import TypingIndicator from "@/components/TypingIndicator";

interface DialogueStep {
  sender: "CLIENT" | "KAURI";
  text: string;
}

interface ScriptBuyerProps {
  onFinished: () => void;
}

export default function ScriptBuyer({ onFinished }: ScriptBuyerProps) {
  const script: DialogueStep[] = [
    { sender: "KAURI", text: "Je suppose que vous êtes un acheteur qui s'apprête à faire un dépôt pour un article sur WhatsApp ou Facebook, n'est-ce pas ? 😉" },
    { sender: "CLIENT", text: "Oui c'est exactement ça ! Mais j'ai peur de me faire arnaquer... Si j'envoie mes FCFA par MoMo en avance et que le vendeur bloque mon numéro ? 😰" },
    { sender: "KAURI", text: "C'est pour ça que KauriPay existe. Tu déposes les fonds dans notre coffre-fort sécurisé. Le vendeur voit que l'argent est consigné, mais il ne peut pas le toucher tant que tu n'as pas le colis." },
    { sender: "CLIENT", text: "Et si le colis arrive vide à la gare de bus ? Je perds mes sous ?" },
    { sender: "KAURI", text: "Non ! Tu inspectes le colis à la gare. S'il y a un problème, tu cliques sur 'Litige' et tout est gelé. Yao ne touche ses FCFA que si tu valides sur ton écran que tout est conforme ! ✅" },
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
