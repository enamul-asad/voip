// import API from "./api";

// export const getCompanies = () => {
//   return API.get("/accounts/admin/companies/");
// };
// export const getAdminCompanies = () =>
//   API.get("accounts/admin/companies/");
// export const createCompany = (data) =>
//   API.post("accounts/admin/companies/", data);
// export const toggleCompanyStatus = (id) =>
//   API.post(`accounts/admin/companies/${id}/toggle/`);

import API from "./api";

export const getCompanies = () =>
  API.get("/accounts/admin/companies/");

export const getAdminCompanies = () =>
  API.get("accounts/admin/companies/");

export const createCompany = (data) =>
  API.post("accounts/admin/companies/", data);

export const toggleCompanyStatus = (id) =>
  API.post(`accounts/admin/companies/${id}/toggle/`);

export const createCompanyUser = (companyId, data) =>
  API.post(`accounts/admin/companies/${companyId}/users/`, data);

export const adjustRate = (companyId, rate) => {
  return api.patch(`/accounts/admin/companies/${companyId}/adjust_rate/`, {
    rate_per_minute: rate
  });
};