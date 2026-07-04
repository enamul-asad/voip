import React from "react";
import { Wallet, AlertTriangle } from "lucide-react";
import DashboardCard from "./DashboardCard";

// ✅ 1. Added 'low' to props
export default function CreditBalanceCard({ balance, currency, low }) {
  
  // Dynamic Color Logic
  const theme = low 
    ? { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: AlertTriangle }
    : { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: Wallet };

  const Icon = theme.icon;

  return (
    <DashboardCard className={`relative overflow-hidden ${theme.border} transition-colors duration-300`}>

      {/* Soft Glow Background */}
      <div className={`absolute inset-0 bg-linear-to-r ${low ? "from-rose-500/10" : "from-emerald-500/10"} to-transparent pointer-events-none`} />

      <div className="relative p-6 flex items-center justify-between">
        
        {/* Left Side: Icon & Label */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${theme.bg} ${theme.color}`}>
            <Icon size={28} />
          </div>

          <div>
            <h4 className="text-sm text-slate-400 font-medium">
              Credit Balance
            </h4>
            
            {/* Conditional Subtext */}
            {low ? (
              <p className="text-xs text-rose-400 mt-1 font-medium flex items-center gap-1 animate-pulse">
                ⚠ Low balance!
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Available funds
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Amount */}
        <div className="text-right">
          <div className={`text-3xl font-bold tracking-tight ${low ? "text-rose-500" : "text-white"}`}>
            {balance}
          </div>
          <div className={`text-sm font-mono font-medium ${theme.color}`}>
            {currency}
          </div>
        </div>

      </div>
    </DashboardCard>
  );
}