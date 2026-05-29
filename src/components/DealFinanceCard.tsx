"use client";

interface DealFinanceCardProps {
  description: string;
  amountFcfa: number;
  status: "PENDING_PAYMENT" | "FUNDS_SECURED" | "IN_DELIVERY" | "RELEASED" | "DISPUTED" | "CANCELLED";
}

export default function DealFinanceCard({ description, amountFcfa, status }: DealFinanceCardProps) {
  
  // 🎨 MOTEUR DE COULEURS DE LUXE DU BADGE SELON LE STATUT PRISMA
  const renderStatusBadge = () => {
    switch (status) {
      case "FUNDS_SECURED":
        return <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">🔒 Sécurisé</span>;
      case "IN_DELIVERY":
        return <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">🚚 En Route</span>;
      case "DISPUTED":
        return <span className="text-[11px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">⚠️ En Litige</span>;
      case "RELEASED":
        return <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">✅ Terminé</span>;
      case "CANCELLED":
        return <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">❌ Annulé</span>;
      default:
        return <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">⏳ Attente</span>;
    }
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-2 text-center w-full flex-shrink-0">
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Objet du séquestre</p>
      
      <p className="text-sm font-black text-slate-800 bg-white inline-block px-3 py-1 rounded-xl border border-slate-100 shadow-2xs">
        📦 {description}
      </p>
      
      <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs font-bold text-slate-600">
        <span>Montant : {amountFcfa.toLocaleString("fr-FR")} F</span>
        {renderStatusBadge()}
      </div>
    </div>
  );
}
