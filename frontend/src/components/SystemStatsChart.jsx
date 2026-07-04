import React from "react";
import DashboardCard from "./DashboardCard";
import BeautifulLineChart from "./BeautifulLineChart";

const SystemStatsChart = ({ label, icon: Icon, data, color, valueSuffix = "%", textColor }) => {
  // Get latest value for the header display
  const latestValue = data[data.length - 1]?.value || 0;

  return (
    <DashboardCard className="flex-1 p-5 min-h-47.5">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Icon size={16} className={textColor} /> {label}
        </h4>
        <span className={`text-xs font-mono ${textColor}`}>
          {latestValue}{valueSuffix}
        </span>
      </div>
      <div className="flex-1 w-full mt-2">
        <BeautifulLineChart data={data} color={color} height={120} />
      </div>
    </DashboardCard>
  );
};

export default SystemStatsChart;