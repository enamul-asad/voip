import React, { useState, useEffect } from "react";
import {
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  ArrowRight,
  Filter,
  Calendar,
  XCircle
} from "lucide-react";
import DashboardCard from "./DashboardCard";

/* ---------- Status Badge (Unchanged) ---------- */
const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || "unknown";
  let styles = "bg-slate-700 text-slate-400 border-slate-600";
  let Icon = Clock;

  if (s === "completed") {
    styles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    Icon = PhoneIncoming;
  }
  if (s === "missed") {
    styles = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    Icon = PhoneMissed;
  }
  if (s === "busy") {
    styles = "bg-orange-500/10 text-orange-400 border-orange-500/20";
    Icon = PhoneOutgoing;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${styles}`}>
      <Icon size={12} />
      <span className="capitalize">{s}</span>
    </span>
  );
};

/* ---------- Main Table Component ---------- */
export default function CallLogsTable({
  callLogs = [],
  title = "Call Logs",
  subtitle = "Recent activity",
  currency = "USD",
  onViewAll = null

}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [callerFilter, setCallerFilter] = useState("");
  const [calleeFilter, setCalleeFilter] = useState("");
  const [minDuration, setMinDuration] = useState("");
  const [maxDuration, setMaxDuration] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;


  // Logic: Filter logs based on selection
  const filteredLogs = callLogs.filter((log) => {
    const status = (log.status || "").toLowerCase();

    const matchesStatus =
      statusFilter === "all" || status === statusFilter;

    const matchesCaller =
      !callerFilter ||
      log.caller?.toString().includes(callerFilter);

    const matchesCallee =
      !calleeFilter ||
      log.callee?.toString().includes(calleeFilter);

    const duration = Number(log.duration || 0);
    const matchesMin =
      !minDuration || duration >= Number(minDuration);
    const matchesMax =
      !maxDuration || duration <= Number(maxDuration);

    const logDate = new Date(log.timestamp)
      .toISOString()
      .split("T")[0];
    const matchesDate = !dateFilter || logDate === dateFilter;

    return (
      matchesStatus &&
      matchesCaller &&
      matchesCallee &&
      matchesMin &&
      matchesMax &&
      matchesDate
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Helper: Cost Calculation

  const formatCost = (cost, currency) => {
    if (cost === null || cost === undefined) return "--";

    const num = Number(cost);
    if (Number.isNaN(num)) return "--";

    return `${num.toFixed(2)} ${currency}`;
  };

  // Helper: Clear filters
  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilter("");
    setCallerFilter("");
    setCalleeFilter("");
    setMinDuration("");
    setMaxDuration("");
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter]);


  // Export CSV 

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ["Caller", "Callee", "Duration", "Status", "Timestamp"];

    const rows = filteredLogs.map(log => [
      log.caller,
      log.callee,
      log.duration,
      log.status,
      new Date(log.timestamp).toLocaleString()
    ]);

    const csvContent =
      [headers, ...rows]
        .map(row => row.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "call_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  return (
    <DashboardCard className="w-full flex flex-col h-full">

      {/* 1. Header Section */}
      <div className="p-5 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/30 shrink-0">

        {/* Title Area */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-slate-500 text-xs">{subtitle}</p>
          </div>
        </div>

        {/* Action Area: Filters OR View All Button */}
        {onViewAll ? (
          // Case A: Dashboard (Show 'View All' Button)
          <button
            onClick={onViewAll}
            className="flex items-center gap-2 text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg transition-all border border-sky-500/20 w-fit"
          >
            View Full History <ArrowRight size={14} />
          </button>
        ) : (

          // Case B: Full Page (Show Filters)
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700">
              Total: {callLogs.length}
            </div>
            {/* Status Dropdown */}
            <div className="relative">
              <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
                <option value="busy">Busy</option>
              </select>
            </div>

            {/* Date Picker */}
            <div className="relative">
              <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-sky-500 uppercase tracking-wider"
              />
            </div>
            {/* Caller Filter */}
            <input
              type="text"
              placeholder="Caller"
              value={callerFilter}
              onChange={(e) => setCallerFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300"
            />

            {/* Callee Filter */}
            <input
              type="text"
              placeholder="Callee"
              value={calleeFilter}
              onChange={(e) => setCalleeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300"
            />

            {/* Duration Min */}
            <input
              type="number"
              placeholder="Min sec"
              value={minDuration}
              onChange={(e) => setMinDuration(e.target.value)}
              className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300"
            />

            {/* Duration Max */}
            <input
              type="number"
              placeholder="Max sec"
              value={maxDuration}
              onChange={(e) => setMaxDuration(e.target.value)}
              className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300"
            />
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 text-xs font-medium
             text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20
             px-3 py-1.5 rounded-lg border border-emerald-500/20"
            >
              Export CSV
            </button>

            {/* Clear Button (Only shows if filters are active) */}
            {(
              statusFilter !== "all" ||
              dateFilter ||
              callerFilter ||
              calleeFilter ||
              minDuration ||
              maxDuration
            ) && (
                <button
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Clear all filters"
                >
                  <XCircle size={18} />
                </button>
              )}

          </div>
        )}
      </div>

      {/* 2. Table Content */}
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 backdrop-blur-sm shadow-sm">
            <tr>
              <th className="px-6 py-4 w-[20%] border-b border-slate-700/50">Caller</th>
              <th className="px-6 py-4 w-[20%] border-b border-slate-700/50">Callee</th>
              <th className="px-6 py-4 w-[15%] border-b border-slate-700/50">Duration</th>
              <th className="px-6 py-4 w-[15%] border-b border-slate-700/50">Status</th>
              <th className="px-6 py-4 text-right">Cost</th>
              <th className="px-6 py-4 w-[30%] text-right border-b border-slate-700/50">Timestamp</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/50">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">
                  {(statusFilter !== "all" || dateFilter)
                    ? "No logs match your filters."
                    : "No call records found."}
                </td>
              </tr>
            ) : (
              paginatedLogs.map((call) => (
                <tr key={call.id} className="hover:bg-slate-700/20 transition-colors duration-150 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                        {(call.caller || "UK").slice(0, 2)}
                      </div> */}
                      <span className="font-medium text-slate-200">{call.caller}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{call.callee}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{call.duration}s</td>
                  <td className="px-6 py-4"><StatusBadge status={call.status} /></td>
                  <td className="px-6 w-[10%] py-4 text-right font-mono text-emerald-300">
                    {formatCost(call.cost, currency)}
                  </td>

                  <td className="px-6 py-4 text-right text-slate-500 text-xs font-mono">
                    {new Date(call.timestamp).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50 text-xs">

            <span className="text-slate-400">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Prev
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardCard>
  );
}