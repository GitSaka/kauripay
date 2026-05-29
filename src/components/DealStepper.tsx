"use client";

import { Check, Lock } from "lucide-react";

interface DealStepperProps {
  status: "PENDING_PAYMENT" | "FUNDS_SECURED" | "IN_DELIVERY" | "RELEASED" | "DISPUTED" | "CANCELLED";
}

export default function DealStepper({ status }: DealStepperProps) {
  // 🧭 Définition stricte des jalons universels
  const steps = [
    { id: 1, label: "Paiement", target: ["FUNDS_SECURED", "IN_DELIVERY", "RELEASED", "DISPUTED"] },
    { id: 2, label: "Expédition", target: ["IN_DELIVERY", "RELEASED", "DISPUTED"] },
    { id: 3, label: "Transit", target: ["IN_DELIVERY", "RELEASED", "DISPUTED"] },
    { id: 4, label: "Clôture", target: ["RELEASED"] },
  ];

  return (
    <div className="w-full bg-slate-50 border border-slate-150 rounded-2xl p-3 flex items-center justify-between shadow-2xs flex-shrink-0">
      {steps.map((step, index) => {
        // 🧠 Calcul automatique des états visuels
        const isCompleted = step.target.includes(status) || status === "RELEASED";
        const isCurrent = 
          (step.id === 1 && status === "PENDING_PAYMENT") ||
          (step.id === 2 && status === "FUNDS_SECURED") ||
          (step.id === 3 && status === "IN_DELIVERY") ||
          (step.id === 4 && status === "DISPUTED");

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* L'icône de l'étape */}
            <div className="flex flex-col items-center gap-1 relative z-10">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300 border ${
                isCompleted 
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-100" 
                  : isCurrent 
                  ? "bg-amber-400 border-amber-400 text-slate-900 animate-pulse shadow-sm shadow-amber-100" 
                  : "bg-white border-slate-200 text-slate-300"
              }`}>
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : !isCompleted && !isCurrent ? (
                  <Lock className="w-3 h-3 text-slate-300" />
                ) : (
                  step.id
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider ${
                isCompleted ? "text-emerald-600" : isCurrent ? "text-amber-500" : "text-slate-300"
              }`}>
                {status === "DISPUTED" && step.id === 4 ? "Litige ⚠️" : step.label}
              </span>
            </div>

            {/* La flèche d'orientation ou ligne de liaison */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 h-0.5 bg-slate-200 relative overflow-hidden">
                <div className={`absolute inset-0 bg-emerald-500 transition-all duration-500 ${
                  isCompleted ? "w-full" : "w-0"
                }`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
