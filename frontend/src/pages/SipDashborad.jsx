import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import {
  Phone,
  Users,
  DollarSign,
  PhoneCall,
  Smartphone,
  Cpu,
  Building2,
  Server
} from "lucide-react";

// --- API SERVICES ---
import { getSipUsers } from "../services/sip";
import {
  getActiveCalls,
  getCallLogs,
  getOnlineExtensions,
  getSystemStats,
  getGlobalActiveCalls,
  getRevenueSummary,
} from "../services/stats";

import { getAdminCompanies } from "../services/adminCompanies"

// --- COMPONENTS ---
import StatCard from "../components/StatCard";
import LiveCallChart from "../components/LiveCallChart";
import SystemStatsChart from "../components/SystemStatsChart";
import DashboardCard from "../components/DashboardCard";
import CallLogsTable from "../components/CallLogsTable";
import CreditBalanceCard from "../components/CreditBalanceCard";
import { getBalanceStatus } from "../services/accounts";
import { downloadInvoice } from "../services/billing";
import InvoiceButton from "../components/InvoiceButton";







// ----------------- HELPERS -----------------
const createEmptySeries = () =>
  Array.from({ length: 15 }, () => ({ time: "", value: 0 }));

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || "";
  let styles = "bg-slate-800 text-slate-400 border-slate-700";

  if (s === "completed") styles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (s === "missed") styles = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  if (s === "busy") styles = "bg-orange-500/10 text-orange-400 border-orange-500/20";

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize border ${styles} inline-flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s === "completed"
        ? "bg-emerald-400"
        : s === "missed"
          ? "bg-rose-400"
          : "bg-slate-400"
        }`}></span>
      {s}
    </span>
  );
};

// ----------------- COMPONENT -----------------
export default function SipDashboard() {
  const { user } = useOutletContext();
  const [sipUsers, setSipUsers] = useState([]);
  const [activeCalls, setActiveCalls] = useState(0);
  const [callLogs, setCallLogs] = useState([]);
  const [balance, setBalance] = useState(null);
  const [extensions, setExtensions] = useState({
    total: 0,
    online: 0,
    offline: 0,
  });
  const [revenue, setRevenue] = useState({
  today: 0,
  month: 0,
  currency: "USD",
});

  const navigate = useNavigate();

  const [chartData, setChartData] = useState(createEmptySeries());
  const [cpuData, setCpuData] = useState(createEmptySeries());
  const [memData, setMemData] = useState(createEmptySeries());
  const [companies, setCompanies] = useState([]);
  const [globalActiveCalls, setGlobalActiveCalls] = useState(0);



  const fetchData = async () => {
    try {
      const time = new Date().toLocaleTimeString();

      const usersRes = await getSipUsers();
      if (usersRes?.data) setSipUsers(usersRes.data);

      const logsRes = await getCallLogs();
      if (logsRes?.data) {
        const sorted = [...logsRes.data].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setCallLogs(sorted);
      }

      const extRes = await getOnlineExtensions();
      if (extRes?.data) setExtensions(extRes.data);

      const callsRes = await getActiveCalls();
      const calls = callsRes?.data?.active_calls || 0;
      setActiveCalls(calls);

      setChartData(prev =>
        [...prev, { time, value: calls }].slice(-15)
      );

      const statsRes = await getSystemStats();
      const cpuVal = statsRes?.data?.cpu || 0;

      // ✅ CORRECT (Checks for .percent first, then falls back to the raw value)
      const memoryData = statsRes?.data?.memory;
      const memVal = memoryData?.percent || 0;

      setCpuData(prev =>
        [...prev, { time, value: cpuVal }].slice(-15)
      );

      setMemData(prev =>
        [...prev, { time, value: memVal }].slice(-15)
      );

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };
  const loadBalance = async () => {
    try {
      const res = await getBalanceStatus();
      setBalance(res.data);
    } catch (err) {
      console.error("Balance load failed", err);
      setBalance(null);
    }
  };

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "super_admin") {
      Promise.all([
        getGlobalActiveCalls(),
        getAdminCompanies(),
        getRevenueSummary(),
      ])
        .then(([callsRes, companiesRes, revenueRes]) => {
          setGlobalActiveCalls(callsRes.data.active_calls);
          setCompanies(companiesRes.data);
          setRevenue(revenueRes.data);
        })
        .catch(() => {
          setGlobalActiveCalls(0);
          setCompanies([]);
          setRevenue({ today: "0.00", month: "0.00", currency: "USD" });
        });
    }
  }, [user]);



  useEffect(() => {
    loadBalance();
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time system monitoring & logs
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          System Online
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(user.role === "client") && (
          <StatCard
            title="Active Calls"
            value={activeCalls}
            icon={Phone}
            colorClass="bg-rose-500/10 text-rose-500"
            subtext="Live connections"
          />
        )}

        {(user.role === "admin" || user.role === "super_admin") && (
          <StatCard
            title="Active Calls"
            value={globalActiveCalls}
            icon={PhoneCall}
            colorClass="bg-rose-500/10 text-rose-500"
            subtext="Ongoing calls (global)"
          />
        )}

        {(user.role === "admin" || user.role === "super_admin") && (
          <StatCard
            title="Revenue Today"
            value={`${revenue.today}`}
            icon={DollarSign}
            colorClass="bg-emerald-500/10 text-emerald-500"
            subtext={`This month: ${revenue.month} ${revenue.currency}`}
          />
        )}


        <StatCard
          title="Online Extensions"
          value={`${extensions.online} / ${extensions.total}`}
          icon={Smartphone}
          colorClass="bg-emerald-500/10 text-emerald-500"
          subtext={`${extensions.offline} Offline`}
        />

        <StatCard
          title="Total Users"
          value={sipUsers.length}
          icon={Users}
          colorClass="bg-blue-500/10 text-blue-500"
          subtext="Registered SIP accounts"
        />
        {(user.role === "admin" || user.role === "super_admin") && (
          <StatCard
            title="Total Companies"
            value={companies.length}
            icon={Building2}
            colorClass="bg-emerald-500/10 text-emerald-500"
            subtext="Active client companies"
          />
        )}

        {/* <StatCard
          title="Credit Balance"
          value={`${user.company.credit_balance} ${user.company.currency}`}
          icon={Wallet}
          colorClass="bg-emerald-500/10 text-emerald-500"
          subtext="Available balance"
        /> */}
        {/* 💳 CREDIT BALANCE */}

        {balance && (
          <CreditBalanceCard
            balance={balance.balance}
            currency={balance.currency}
            low={balance.low_balance}
          />
        )}


        {/* ✅ The Button */}
        <InvoiceButton
          invoiceId={2}
          year={2025}
          month="Dec"
          filename="VoIP_Invoice_Dec25.pdf"
        />


      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <LiveCallChart data={chartData} />

        <div className="flex flex-col gap-6">
          <SystemStatsChart
            label="CPU Load"
            icon={Cpu}
            data={cpuData}
            color="#38bdf8"
            textColor="text-sky-400"
          />

          <SystemStatsChart
            label="Memory Usage"
            icon={Server}
            data={memData}
            color="#f472b6"
            textColor="text-pink-400"
          />
        </div>
      </div>

      <CallLogsTable
        title="Recent Call Logs"
        subtitle="Last 5 activities"
        callLogs={callLogs.slice(0, 5)}       // ✅ Show only 5
        onViewAll={() => navigate("/calls")}   // ✅ Button redirects to /calls
      />
    </div>
  );
}
