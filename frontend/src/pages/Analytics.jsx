import { useEffect, useState } from "react";
import {
  Wallet,
  PhoneCall,
  Building2,
  TrendingUp
} from "lucide-react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import DashboardCard from "../components/DashboardCard";
import StatCard from "../components/StatCard";

import {
  getRevenueSummary,
  getGlobalActiveCalls,
  getRevenueAnalytics
} from "../services/stats";
import { getAdminCompanies } from "../services/accounts";

export default function Analytics() {
  const [revenue, setRevenue] = useState({
    today: 0,
    month: 0,
    currency: "USD",
  });

  const [activeCalls, setActiveCalls] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [ranking, setRanking] = useState([]);

  const loadAnalytics = async () => {
    try {
      const [summaryRes, callsRes, companiesRes, analyticsRes] =
        await Promise.all([
          getRevenueSummary(),
          getGlobalActiveCalls(),
          getAdminCompanies(),
          getRevenueAnalytics(),
        ]);

      setRevenue(summaryRes.data);
      setActiveCalls(callsRes.data?.active_calls || 0);
      setCompaniesCount(companiesRes.data.length || 0);

      setDailyData(analyticsRes.data.daily);
      setMonthlyData(analyticsRes.data.monthly);
      setRanking(analyticsRes.data.ranking);

    } catch (err) {
      console.error("Failed to load analytics", err);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-8 pb-8">

      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm">
          System-wide insights & revenue performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <StatCard
          title="Revenue Today"
          value={`${revenue.today}`}
          icon={Wallet}
          colorClass="bg-emerald-500/10 text-emerald-500"
          subtext={`This month: ${revenue.month} ${revenue.currency}`}
        />

        <StatCard
          title="Active Calls"
          value={activeCalls}
          icon={PhoneCall}
          colorClass="bg-rose-500/10 text-rose-500"
          subtext="Global live calls"
        />

        <StatCard
          title="Total Companies"
          value={companiesCount}
          icon={Building2}
          colorClass="bg-blue-500/10 text-blue-500"
          subtext="Registered tenants"
        />

        <StatCard
          title="Growth"
          value="—"
          icon={TrendingUp}
          colorClass="bg-purple-500/10 text-purple-500"
          subtext="Revenue trend"
        />
      </div>

      {/* DAILY CHART */}
      <DashboardCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Last 7 Days Revenue
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </DashboardCard>

      {/* MONTHLY CHART */}
      <DashboardCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Last 6 Months Revenue
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </DashboardCard>

      {/* COMPANY RANKING */}
      <DashboardCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Top Companies by Revenue
        </h3>

        <div className="space-y-3">
          {ranking.map((company, index) => (
            <div
              key={index}
              className="flex justify-between bg-slate-800 p-3 rounded"
            >
              <span>{company.name}</span>
              <span className="text-emerald-400">
                {company.revenue} {revenue.currency}
              </span>
            </div>
          ))}
        </div>
      </DashboardCard>

    </div>
  );
}
