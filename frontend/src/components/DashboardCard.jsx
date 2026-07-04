import React from "react";

const DashboardCard = ({ children, className = "" }) => (
  <div className={`bg-[#1e293b]/70 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-xl overflow-hidden flex flex-col ${className}`}>
    {children}
  </div>
);

export default DashboardCard;