import { useEffect, useState } from "react";
import { PhoneCall, Activity, Signal } from "lucide-react";
import { useOutletContext } from "react-router-dom";

import {
  getActiveCalls,
  getCallLogs,
  getGlobalActiveCalls,
} from "../services/stats";

import CallLogsTable from "../components/CallLogsTable";
import DashboardCard from "../components/DashboardCard";

export default function Calls() {
  const { user } = useOutletContext();

  const [activeCalls, setActiveCalls] = useState(0);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    user?.role === "admin" || user?.role === "super_admin";

  const loadData = async () => {
  try {
    let callsRes, logsRes;

    if (isAdmin) {
      // ADMIN → GLOBAL ACTIVE CALLS
      callsRes = await getGlobalActiveCalls();
    } else {
      // CLIENT → COMPANY ACTIVE CALLS
      callsRes = await getActiveCalls();
    }

    // 🔥 CALL LOGS (same endpoint for both)
    logsRes = await getCallLogs();

    setActiveCalls(callsRes?.data?.active_calls ?? 0);
    setCallLogs(logsRes?.data ?? []);
  } catch (err) {
    console.error("Failed to load calls data", err);
    setActiveCalls(0);
    setCallLogs([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (!user) return;

    loadData();
    const interval = setInterval(loadData, 3000); // live refresh

    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="space-y-8 pb-8">

      {/* ===== ACTIVE CALLS CARD ===== */}
      <DashboardCard className="relative overflow-hidden border-rose-500/30">

        {/* Background glow */}
        <div className="absolute inset-0 bg-linear-to-r from-rose-500/10 to-transparent pointer-events-none" />

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">

          {/* LEFT */}
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="relative">
              <div
                className={`p-4 rounded-2xl bg-rose-500/20 text-rose-400 shadow-inner shadow-rose-500/10 ${
                  activeCalls > 0 ? "animate-pulse" : ""
                }`}
              >
                <PhoneCall size={32} />
              </div>

              {activeCalls > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                {isAdmin ? "Global Active Sessions" : "Active Sessions"}
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400 font-medium">
                  <Activity size={12} /> LIVE
                </span>
              </h2>

              <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
                <Signal size={14} className="text-emerald-400" />
                {isAdmin
                  ? "Real-time VoIP traffic across all companies"
                  : "Real-time VoIP traffic monitoring"}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-700/50 pt-4 md:pt-0">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Current Load
              </div>
              <div className="text-xs text-rose-400/80 font-mono">
                Updated live
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-5xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                {activeCalls}
              </span>
              <span className="text-lg font-medium text-slate-500">
                calls
              </span>
            </div>
          </div>

        </div>
      </DashboardCard>

      {/* ===== CALL LOGS TABLE ===== */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CallLogsTable
          title={isAdmin ? "All Call Logs" : "Your Call Logs"}
          subtitle={
            isAdmin
              ? "Calls across all companies"
              : "Your company call history"
          }
          callLogs={callLogs}
        />
      </div>

    </div>
  );
}
