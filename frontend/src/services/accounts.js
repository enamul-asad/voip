import API from "./api";

export const updateCompanySettings = (payload) =>
  API.put("accounts/settings/company/", payload);

export const logoutAllSessions = () =>
  API.post("accounts/logout-all/");

// ✅ FIX: Match Django 'path("balance-status/", ...)'
export const getBalanceStatus = () =>
  API.get("accounts/balance-status/");

export const changePassword = (data) =>
  API.post("accounts/change-password/", data);

export const getAdminCompanies = () =>
  API.get("accounts/admin/companies/");


