import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import API, { setAuthToken } from "./services/api";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleGuard from "./routes/RoleGuard";

import SipDashboard from "./pages/SipDashborad";
import Calls from "./pages/Calls";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import Companies from "./pages/admin/Companies";
import Analytics from "./pages/Analytics";
import ForcePasswordChange from "./pages/ForcePasswordChange";
import SipUsers from "./pages/admin/SipUsers";
import AdminBillingDashboard from "./pages/admin/AdminBillingDashboard";

export default function App() {

  // null = loading, false = not logged in, object = logged in
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  // ------------------------------
  // 🌙 THEME STATE
  // ------------------------------
  const [dark, setDark] = useState(
    localStorage.getItem("theme") !== "light"
  );

  const toggleTheme = () => {
    const newTheme = !dark;
    setDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  // ------------------------------
  // 🔐 LOGOUT
  // ------------------------------
  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setAuthToken(null);
    setUser(false);
    navigate("/login", { replace: true });
  };

  // ------------------------------
  // 👤 LOAD USER
  // ------------------------------
  const loadUser = async () => {
    try {
      const res = await API.get("accounts/me/");

      if (res.data.force_password_change) {
        setUser(res.data);
        navigate("/force-change-password");
        return;
      }

      setUser(res.data);

    } catch (err) {
      console.error("Load user failed", err);
      logout();
    }
  };

  // ------------------------------
  // 🔑 CHECK TOKEN ON APP LOAD
  // ------------------------------
  useEffect(() => {
    const token = localStorage.getItem("access");

    if (token) {
      setAuthToken(token);
      loadUser();
    } else {
      setUser(false);
    }
  }, []);

  return (
    <Routes>

      {/* Public */}
      <Route
        path="/login"
        element={<Login onLogin={loadUser} />}
      />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute user={user}>
            <DashboardLayout
              user={user}
              dark={dark}
              toggleTheme={toggleTheme}
              onLogout={logout}
            />
          </ProtectedRoute>
        }
      >

        <Route index element={<SipDashboard />} />
        <Route path="/dashboard" element={<SipDashboard />} />

        <Route
          path="/calls"
          element={
            <RoleGuard roles={["client", "admin"]} user={user}>
              <Calls />
            </RoleGuard>
          }
        />

        <Route
          path="/billing"
          element={
            <RoleGuard roles={["client", "admin"]} user={user}>
              <Billing />
            </RoleGuard>
          }
        />

        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <Companies />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/sip-users"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <SipUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/billing"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <AdminBillingDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/force-change-password"
          element={
            <ProtectedRoute user={user} allowedRoles={["client"]}>
              <ForcePasswordChange />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <RoleGuard roles={["client", "admin"]} user={user}>
              <Settings />
            </RoleGuard>
          }
        />

      </Route>

    </Routes>
  );
}