import { LayoutDashboard, Phone, Users, Settings, Wallet, LogOut, Building2, BarChart3 } from "lucide-react";
import { NavLink } from "react-router-dom";

const menu = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    roles: ["client", "admin"],
  },

  // 🏢 ADMIN ONLY
  {
    name: "Companies",
    icon: Building2,
    path: "/admin/companies",
    roles: ["admin"],
  },

  {
    name: "Calls",
    icon: Phone,
    path: "/calls",
    roles: ["client", "admin"],
  },
  {
    name: "Sip Users",
    icon: Users,
    path: "/admin/sip-users",
    roles: ["admin"],
  },
  {
    name: "Billing",
    icon: Wallet,
    path: "/billing",
    roles: ["client"],
  },
  {
    name: "Billing",
    icon: Wallet,
    path: "/admin/billing",
    roles: ["admin"],
  },
  {
    name: "Analytics",
    icon: BarChart3,
    path: "/analytics",
    roles: ["admin"],
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/settings",
    roles: ["client", "admin"],
  },


];


export default function Sidebar({ open, onLogout, user }) {
  // 🔒 Safety: don't render sidebar until user exists
  if (!user) return null;

  const allowedMenu = menu.filter(item =>
    item.roles.includes(user.role)
  );

  return (
    <aside
      className={`
  bg-white dark:bg-slate-900
  text-slate-900 dark:text-white
  h-screen flex flex-col
  border-r border-slate-200 dark:border-slate-800
  transition-all duration-300 ease-in-out
  ${open ? "w-64" : "w-0 overflow-hidden"}
`}
    >
      {/* --- Logo --- */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-linear-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-xl font-bold">
            V
          </div>
          <div className="font-bold text-lg tracking-tight">
            VoIP <span className="text-sky-400">Panel</span>
          </div>
        </div>
      </div>

      {/* --- Menu --- */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {allowedMenu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 font-medium
                  ${isActive
                    ? "bg-sky-600/10 text-sky-400 border border-sky-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* --- Logout --- */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
