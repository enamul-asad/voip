


import API from "./api";

export const getSipUsers = () => API.get("sip/users/");

export const createSipUser = (data) =>
  API.post("sip/users/create/", data);

export const toggleSipUser = (id) =>
  API.post(`sip/users/${id}/toggle/`);

export const resetSipPassword = (id) =>
  API.post(`sip/users/${id}/reset-password/`);