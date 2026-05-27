import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  RadioTower,
  ScrollText,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { AdminNavItem } from "../../interfaces/admin.interface";

const navItems: Array<AdminNavItem & { icon: React.ReactNode }> = [
  {
    label: "Tổng quan",
    path: "/admin",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Kiểm duyệt",
    path: "/admin/moderation",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    label: "Người dùng",
    path: "/admin/users",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Nhật ký",
    path: "/admin/audit-logs",
    icon: <ScrollText className="h-4 w-4" />,
  },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden w-72 flex-shrink-0 border-r border-slate-800 bg-slate-950 text-slate-100 lg:block">
      <div className="flex h-full flex-col px-4 py-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
              <RadioTower className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Quản trị OTT
              </p>
              <h2 className="text-base font-semibold text-white">Bảng điều khiển</h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Theo dõi tăng trưởng người dùng, kiểm duyệt và hoạt động nền tảng.
          </p>
        </div>

        <div className="mt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Khu vực
          </p>
        </div>

        <nav className="mt-3 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Nguồn dữ liệu
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li className="flex items-center justify-between">
              <span>User Service</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                Sự kiện
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>RabbitMQ</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                Luồng
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>PostgreSQL</span>
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">
                Lưu trữ
              </span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
