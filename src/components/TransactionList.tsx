"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

interface Transaction {
  id: string;
  ref: string;
  amount: number;
  description: string;
  status: "PENDING_PAYMENT" | "FUNDS_SECURED" | "IN_DELIVERY" | "RELEASED" | "DISPUTED" | "CANCELLED";
  role: "BUYER" | "SELLER";
  partnerName: string;
  date: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  activeTab: "ACHATS" | "VENTES";
  renderStatusBadge: (status: string) => React.ReactNode;
}

export default function TransactionList({ transactions, activeTab, renderStatusBadge }: TransactionListProps) {
  const router = useRouter();

  const filteredTransactions = transactions.filter((tx) => 
    activeTab === "ACHATS" ? tx.role === "BUYER" : tx.role === "SELLER"
  );

  return (
    /* 🔒 FIXATION CHIRURGICALE : On utilise max-h pour bloquer la boîte sur PC et h-[calc...] pour le mobile */
    /* Cela garantit que la liste s'arrête PILE au-dessus de la barre de navigation noire Binance */
    <div className="mt-4 flex-1 flex flex-col h-full max-h-[350px] sm:max-w-md sm:max-h-[440px] overflow-hidden">
      
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
        {activeTab === "ACHATS" ? "Colis que j'attends (Achats)" : "Commandes à expédier (Ventes)"}
      </h3>
      
      {filteredTransactions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-150 rounded-2xl p-6 text-center bg-slate-50/50">
          <div className="flex flex-col items-center">
            <Clock className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-400">
              {activeTab === "ACHATS" ? "Aucun achat sécurisé en cours." : "Aucun lien de vente actif pour le moment."}
            </p>
          </div>
        </div>
      ) : (
        /* 🚀 SCROLL SECURISE INDESTRUCTIBLE : Supprime la barre grise et gère les grands volumes fluides */
        <div className="space-y-3 overflow-y-auto flex-1 pb-4 pr-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredTransactions.map((tx) => (
            <div 
              key={tx.id} 
              onClick={() => router.push(`/dashboard/deal/${tx.id}`)}
              className="p-3.5 bg-white hover:bg-slate-50 border border-slate-155 rounded-2xl transition-all flex items-center justify-between cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  tx.role === "BUYER" ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                }`}>
                  {tx.role === "BUYER" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs font-black text-gray-800 truncate max-w-[140px]">{tx.description || "Achat Sécurisé"}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                    {tx.role === "BUYER" ? `À: ${tx.partnerName}` : `De: ${tx.partnerName}`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-black text-gray-800">{tx.amount.toLocaleString("fr-FR")} F</p>
                <div className="mt-1">
                  {renderStatusBadge(tx.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
