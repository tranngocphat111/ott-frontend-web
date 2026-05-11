import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShieldAlert, Users, ScrollText } from "lucide-react";
import type { AdminNavItem } from "../../interfaces/admin.interface";
import { useAuth } from "../../contexts/AuthContext";

const navItems: Array<AdminNavItem & { icon: React.ReactNode }> = [
  {
    label: "Tổng quan",
    path: "/admin",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "Kiểm duyệt nội dung",
    path: "/admin/moderation",
    icon: <ShieldAlert className="w-4 h-4" />,
  },
  {
    label: "Quản lý người dùng",
    path: "/admin/users",
    icon: <Users className="w-4 h-4" />,
  },
  {
    label: "Nhật ký hệ thống",
    path: "/admin/audit-logs",
    icon: <ScrollText className="w-4 h-4" />,
  },
];

const Sidebar: React.FC = () => {
  const { userRole } = useAuth();

  const filtered = navItems.filter((item) => {
    // hide Content Moderation for ANALYST role
    if (item.path === "/admin/moderation" && userRole === "ANALYST")
      return false;
    if (item.path === "/admin/audit-logs" && userRole !== "SUPER_ADMIN")
      return false;
    return true;
  });

  return (
    <aside className="w-64 p-4 border-r bg-slate-900 text-slate-100 border-slate-800">
      <h2 className="mb-6 text-lg font-bold">Khu vực quản trị</h2>
      <nav className="space-y-2">
        {filtered.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                isActive
                  ? "bg-indigo-500 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
