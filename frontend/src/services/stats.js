import API from "./api";

export const getActiveCalls = () =>
  API.get("stats/active-calls/");

export const getOnlineExtensions = () =>
  API.get("stats/online-extensions/");

export const getCallLogs = () =>
  API.get("stats/calls/");  

export const getSystemStats = () =>
  API.get("stats/system/");

export const getGlobalActiveCalls = () =>
  API.get("stats/active-calls/global/");

export const getRevenueSummary = () =>
  API.get("stats/revenue/summary/");

export const getRevenueAnalytics = () =>
  API.get("stats/revenue/analytics/");
