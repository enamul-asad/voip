import React from "react";
import { Activity } from "lucide-react";
import DashboardCard from "./DashboardCard";
import BeautifulLineChart from "./BeautifulLineChart";

const LiveCallChart = ({ data }) => {
  return (
    <DashboardCard className="xl:col-span-2 p-6 min-h-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity size={18} className="text-cyan-400" /> 
            Live Call Volume
          </h3>
          <p className="text-slate-500 text-xs mt-1">Traffic monitoring (Real-time)</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-3 h-3 rounded-full bg-cyan-500/20 border border-cyan-500"></span> Incoming
        </div>
      </div>
      
      <div className="flex-1 w-full bg-[#0f172a]/30 rounded-xl border border-slate-700/30 p-4 relative">
         <BeautifulLineChart data={data} color="#22d3ee" height={300} />
      </div>
    </DashboardCard>
  );
};

export default LiveCallChart;