import { Lock, Shield, Smartphone, Check, KeyRound, MessageCircle, Server } from 'lucide-react';
import type { LucideIcon } from "lucide-react";

type SecurityItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const SECURITY_ITEMS: SecurityItem[] = [
  {
    icon: Lock,
    title: 'Mã hóa End-to-End',
    description: 'Tin nhắn được mã hóa hoàn toàn. Chỉ người gửi và người nhận mới đọc được.',
  },
  {
    icon: Shield,
    title: 'Xác thực 2 lớp (2FA)',
    description: 'Bảo vệ tài khoản với mã OTP qua email khi đăng nhập từ thiết bị mới.',
  },
  {
    icon: Smartphone,
    title: 'Quản lý thiết bị',
    description: 'Xem và kiểm soát mọi thiết bị đang đăng nhập. Đăng xuất từ xa ngay lập tức.',
  },
];

const CHECKS: string[] = ['Mã hóa SSL/TLS', 'Xác thực 2 lớp', 'Giám sát 24/7', 'Tuân thủ GDPR'];

const SecurityVisual = () => (
  <div
    className="relative min-h-[560px] overflow-hidden rounded-3xl shadow-xl"
    style={{
      border: '1px solid var(--color-primary-200)',
      background:
        'linear-gradient(160deg, #fff9f3 0%, var(--color-primary-100) 42%, var(--color-primary-700) 100%)',
    }}
  >
    <div
      className="absolute inset-x-0 top-0 h-36 opacity-70"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0))',
      }}
    />
    <div
      className="absolute right-6 top-6 h-36 w-36 opacity-35"
      style={{
        backgroundImage: 'radial-gradient(var(--color-primary-400) 1px, transparent 1px)',
        backgroundSize: '12px 12px',
      }}
    />

    <div className="absolute left-8 top-9 w-[68%] rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
          <Lock className="h-3 w-3" />
          Secure
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {['Trần Ngọc Phát', 'Nhóm đồ án IUH', 'My Documents'].map((name, index) => (
            <div
              key={name}
              className={`rounded-2xl p-3 ${
                index === 1 ? 'bg-primary-50 shadow-sm ring-1 ring-primary-100' : 'bg-white/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-200 text-xs font-bold text-primary-800">
                  {name.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-2.5 w-24 rounded-full bg-primary-300/70" />
                  <div className="h-2 w-28 rounded-full bg-primary-100" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-[#f5f7f8] p-4">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded-full bg-primary-800/80" />
                <div className="h-2 w-20 rounded-full bg-emerald-200" />
              </div>
            </div>
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="space-y-3">
            <div className="max-w-[76%] rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm">
              <div className="h-2.5 w-32 rounded-full bg-primary-100" />
              <div className="mt-2 h-2 w-20 rounded-full bg-primary-50" />
            </div>
            <div className="ml-auto max-w-[72%] rounded-2xl rounded-tr-md bg-primary-200 px-4 py-3 shadow-sm">
              <div className="h-2.5 w-28 rounded-full bg-primary-700/35" />
              <div className="mt-2 h-2 w-16 rounded-full bg-primary-700/20" />
            </div>
            <div className="max-w-[64%] rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm">
              <div className="h-2.5 w-24 rounded-full bg-primary-100" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="absolute bottom-16 right-10 w-60 rounded-3xl border border-white/45 bg-primary-900/82 p-5 text-white shadow-2xl backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
          <KeyRound className="h-6 w-6 text-primary-200" />
        </div>
        <span className="rounded-full bg-emerald-500/18 px-3 py-1 text-xs font-bold text-emerald-200">
          Active
        </span>
      </div>
      <p className="font-display text-lg font-bold">Phiên đăng nhập an toàn</p>
      <div className="mt-4 space-y-2.5">
        <div className="flex items-center gap-2 text-sm text-primary-100">
          <Server className="h-4 w-4 text-primary-300" />
          TLS channel verified
        </div>
        <div className="flex items-center gap-2 text-sm text-primary-100">
          <Smartphone className="h-4 w-4 text-primary-300" />
          Thiết bị đã xác thực
        </div>
      </div>
    </div>

    <div className="absolute bottom-8 left-8 flex items-center gap-3 rounded-2xl border border-white/55 bg-white/88 px-4 py-3 shadow-xl backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <Shield className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-primary-900">Dữ liệu được bảo vệ</p>
        <p className="text-xs text-primary-500">Mã hóa khi truyền và lưu trữ</p>
      </div>
    </div>
  </div>
);

const SecuritySection = () => (
  <section id="security" className="py-28 overflow-hidden" style={{ background: 'var(--color-surface)' }}>
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid lg:grid-cols-2 gap-20 items-center">

        {/* Left — content */}
        <div>
          <p
            className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-primary-500)' }}
          >
            Bảo mật
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold leading-tight mb-5"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-900)' }}
          >
            Dữ liệu của bạn,
            <br />
            <em className="not-italic" style={{ color: 'var(--color-primary-500)' }}>
              chỉ của bạn
            </em>
          </h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--color-primary-600)' }}>
            Chúng tôi cam kết bảo vệ thông tin cá nhân với các tiêu chuẩn bảo mật cao nhất — không thỏa hiệp.
          </p>

          <div className="space-y-7">
            {SECURITY_ITEMS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4 group">
                <div
                  className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{ background: 'var(--color-primary-100)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--color-primary-600)' }} />
                </div>
                <div>
                  <h3
                    className="text-sm font-semibold mb-1"
                    style={{ color: 'var(--color-primary-900)' }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-primary-600)' }}>
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — visual */}
        <div className="relative">
          <SecurityVisual />

          {/* Floating checklist card */}
          <div
            className="absolute -left-8 bottom-12 p-5 rounded-2xl shadow-lg animate-fade-in"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-primary-200)',
              minWidth: '200px',
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--color-primary-500)' }}
            >
              Chứng nhận
            </p>
            {CHECKS.map((item) => (
              <div key={item} className="flex items-center gap-2.5 mb-2 last:mb-0">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-primary-500)' }}
                >
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-primary-800)' }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Decorative dot grid */}
          <div
            className="absolute -right-6 -top-6 w-32 h-32 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(var(--color-primary-400) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />
        </div>
      </div>
    </div>
  </section>
);

export default SecuritySection;
