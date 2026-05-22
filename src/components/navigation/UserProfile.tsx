import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";
import { LogOut, MoreVertical, Shield, User } from "lucide-react";
import logo from "../../assets/logo_tach_nen.jpg";

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    navigate("/login", { replace: true });
  };

  if (!user) return null;

  return (
    <div className="relative mb-8" ref={menuRef}>
      <div
        role="button"
        tabIndex={0}
        className="relative block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        onClick={() => setShowMenu((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setShowMenu((value) => !value);
          }
        }}
        title="Tài khoản"
      >
        <Avatar
          src={user.avatarUrl}
          name={user.fullName || "User"}
          size={40}
          className={`cursor-pointer transition-all ${showMenu ? "ring-4 ring-primary-200" : "ring-2 ring-primary-500 hover:ring-4"}`}
        />
      </div>

      {showMenu && (
        <div className="absolute left-14 top-0 z-[120] w-56 overflow-hidden rounded-2xl border border-[#ead9cc] bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#f1e4d7] bg-[#fffaf6] px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#f1e4d7] bg-white shadow-sm">
              <img src={logo} alt="Riff" className="h-6 w-6 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#5f432c]">
                {user.fullName || "Riff"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowMenu(false);
              navigate("/profile");
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#6f5136] hover:bg-[#fff7f1]"
          >
            <User size={14} className="text-[#b8895f]" />
            Trang cá nhân
          </button>
          <button
            onClick={() => {
              setShowMenu(false);
              navigate("/security/2fa");
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#6f5136] hover:bg-[#fff7f1]"
          >
            <Shield size={14} className="text-[#b8895f]" />
            Bảo mật
          </button>
          <button
            onClick={() => {
              setShowMenu(false);
              navigate("/settings");
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#6f5136] hover:bg-[#fff7f1]"
          >
            <MoreVertical size={14} className="text-[#b8895f]" />
            Cài đặt
          </button>

          <div className="my-1 h-px bg-[#f1e4d7]" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#d65b4a] hover:bg-[#fff0ee]"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
