import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const UserNotAvailable: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/social");
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex-1 w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Glassmorphism card */}
      <div className="relative z-10 w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[32px] p-10 flex flex-col items-center text-center shadow-2xl">
        <div className="size-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/30">
          <ShieldAlert className="size-10 text-red-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">
          Trang cá nhân không khả dụng
        </h2>
        
        <p className="text-slate-400 text-[15px] leading-relaxed mb-8">
          Liên kết này có thể đã bị hỏng hoặc trang cá nhân đã bị gỡ. Vui lòng kiểm tra lại đường dẫn mà bạn đang cố mở.
        </p>

        <button
          type="button"
          onClick={() => navigate("/social")}
          className="w-full h-12 rounded-xl bg-white text-slate-900 font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          <ArrowLeft className="size-4" />
          <span>Trở về Bảng tin</span>
        </button>
      </div>
    </div>
  );
};

export default UserNotAvailable;
