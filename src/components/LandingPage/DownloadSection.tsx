import { Smartphone, Globe, MessageCircle, ArrowRight } from 'lucide-react';
import type { LucideIcon } from "lucide-react";

type Platform = {
  icon: LucideIcon;
  title: string;
  sub: string;
  image: string;
  action: {
    label: string;
    href: string;
  };
};

const PLATFORMS: Platform[] = [
  {
    icon: Smartphone,
    title: 'Mobile App',
    sub: 'iOS & Android',
    image: '/images/platform-mobile.jpg',
    action: { label: 'Tải về', href: '#' },
  },
  {
    icon: Globe,
    title: 'Web App',
    sub: 'Mọi trình duyệt',
    image: '/images/platform-web.jpg',
    action: { label: 'Sử dụng ngay', href: '/login' },
  },
  {
    icon: MessageCircle,
    title: 'Desktop App',
    sub: 'Windows & macOS',
    image: '/images/platform-desktop.jpg',
    action: { label: 'Tải về', href: '#' },
  },
];

type PlatformCardProps = Platform;

const PlatformCard = ({ icon: Icon, title, sub, image, action }: PlatformCardProps) => (
  <div
    className="group relative rounded-2xl overflow-hidden text-left transition-all duration-500 hover-lift"
    style={{
      background: 'rgba(255,252,250,0.06)',
      border: '1px solid rgba(223,192,164,0.15)',
    }}
  >
    <div className="relative h-40 overflow-hidden">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = 'none';
          if (el.parentElement) el.parentElement.style.background = 'rgba(223,192,164,0.1)';
        }}
      />
    </div>

    <div className="p-6">
      <Icon className="w-7 h-7 mb-3" style={{ color: 'var(--color-primary-300)' }} />
      <h3
        className="text-lg font-bold text-white mb-0.5"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      <p className="text-sm mb-5" style={{ color: 'var(--color-primary-400)' }}>
        {sub}
      </p>
      <a
        href={action.href}
        className="btn-ripple transition-base inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg"
        style={{ background: 'var(--color-primary-500)', color: 'white' }}
      >
        {action.label}
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  </div>
);

const DownloadSection = () => (
  <section
    id="download"
    className="py-28 relative overflow-hidden"
    style={{
      background: 'linear-gradient(160deg, var(--color-primary-800) 0%, var(--color-primary-900) 100%)',
    }}
  >
    {/* Grain texture */}
    <svg
      className="absolute inset-0 w-full h-full opacity-5 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <filter id="grain-download">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-download)" />
    </svg>

    {/* Glow */}
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-15 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse, var(--color-primary-400) 0%, transparent 70%)' }}
    />

    <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
      <p
        className="text-xs font-bold tracking-widest uppercase mb-3"
        style={{ color: 'var(--color-primary-300)' }}
      >
        Tải về
      </p>
      <h2
        className="text-4xl md:text-5xl font-bold mb-5 text-white"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Bắt đầu ngay hôm nay
      </h2>
      <p
        className="text-base max-w-lg mx-auto mb-14 leading-relaxed"
        style={{ color: 'var(--color-primary-300)' }}
      >
        Tải ứng dụng hoặc dùng ngay trên trình duyệt — miễn phí, không giới hạn.
      </p>

      <div className="grid md:grid-cols-3 gap-5 mb-14">
        {PLATFORMS.map((platform) => (
          <PlatformCard key={platform.title} {...platform} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href="/register"
          className="btn-ripple transition-base px-8 py-3.5 text-sm font-bold rounded-xl shadow-md hover:shadow-lg"
          style={{
            background: 'var(--color-primary-400)',
            color: 'var(--color-primary-900)',
          }}
        >
          Đăng ký miễn phí
        </a>
        <a
          href="/login"
          className="transition-base px-8 py-3.5 text-sm font-bold rounded-xl"
          style={{
            background: 'rgba(255,252,250,0.08)',
            color: 'var(--color-primary-200)',
            border: '1px solid rgba(223,192,164,0.2)',
          }}
        >
          Đăng nhập
        </a>
      </div>
    </div>
  </section>
);

export default DownloadSection;