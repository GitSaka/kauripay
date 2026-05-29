"use client";

import { UserCheck } from "lucide-react";

interface PlatformUser {
  id: string;
  name: string;
  phone: string;
  kycStatus: string;
  role: string;
  totalSales: number;
  createdAt: string;
}

interface AdminUsersProps {
  users: PlatformUser[];
  onVerifyKyc: (id: string) => void;
}

export default function AdminUsers({ users, onVerifyKyc }: AdminUsersProps) {
  return (
    <div className="space-y-2 w-full animate-fade-in">
      {users.map((user) => (
        <div key={user.id} className="bg-slate-50 border border-slate-150 rounded-2xl p-3 flex items-center justify-between gap-3 w-full">
          <div className="min-w-0 flex-1 space-y-0.5 text-left">
            <p className="text-xs font-black text-slate-800 truncate flex items-center gap-1">
              {user.name}
              {user.role === "ADMIN" && <span className="bg-red-50 text-red-700 px-1 py-0.5 text-[7.5px] rounded border border-red-100 font-mono font-black">ADMIN</span>}
            </p>
            <p className="text-[9px] font-bold text-slate-400 font-mono">{user.phone}</p>
          </div>
          <div className="flex-shrink-0">
            {user.kycStatus === "verified" ? (
              <span className="text-[8px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-0.5 select-none">
                <UserCheck className="w-3 h-3 text-emerald-500" /> Vérifié
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onVerifyKyc(user.id)}
                className="text-[8px] font-black uppercase text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md border border-amber-200 cursor-pointer transition-colors outline-none border-none"
              >
                Valider KYC 📝
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
