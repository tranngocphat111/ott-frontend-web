import { Lock, Shield, Smartphone, Check } from 'lucide-react';
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
          <div
            className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-xl"
            style={{ border: '1px solid var(--color-primary-200)' }}
          >
            <img
              src="/images/security-visual.jpg"
              alt="Bảo mật Riff"
              className="w-full h-full object-cover"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = 'none';
                if (el.parentElement) {
                  el.parentElement.style.background =
                    'linear-gradient(160deg, var(--color-primary-100), var(--color-primary-200))';
                }
              }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(35,26,16,0.6) 0%, transparent 50%)' }}
            />
          </div>

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