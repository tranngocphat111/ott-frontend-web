import { Smartphone, Globe, MessageCircle, ArrowRight } from 'lucide-react';
import type { LucideIcon } from "lucide-react";

type Platform = {
  icon: LucideIcon;
  title: string;
  sub: string;
  preview: 'mobile' | 'web' | 'desktop';
  action: {
    label: string;
    href: string;
    download?: string;
  };
};

const ANDROID_APK_URL = import.meta.env.VITE_ANDROID_APK_URL || '/downloads/riff.apk';

const PLATFORMS: Platform[] = [
  {
    icon: Smartphone,
    title: 'Mobile App',
    sub: 'iOS & Android',
    preview: 'mobile',
    action: { label: 'Tải về', href: ANDROID_APK_URL, download: 'Riff.apk' },
  },
  {
    icon: Globe,
    title: 'Web App',
    sub: 'Mọi trình duyệt',
    preview: 'web',
    action: { label: 'Sử dụng ngay', href: '/login' },
  },
  {
    icon: MessageCircle,
    title: 'Desktop App',
    sub: 'Windows & macOS',
    preview: 'desktop',
    action: { label: 'Tải về', href: '#' },
  },
];

type PlatformCardProps = Platform;

const PlatformPreview = ({ type }: { type: Platform['preview'] }) => {
  if (type === 'mobile') {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(145deg,rgba(255,252,250,0.16),rgba(188,145,102,0.06))]">
        <div className="relative h-34 w-18 rounded-[1.4rem] border border-primary-200/35 bg-primary-900/80 p-1.5 shadow-2xl">
          <div className="mx-auto mb-1 h-1 w-7 rounded-full bg-primary-200/45" />
          <div className="h-[calc(100%-0.5rem)] rounded-[1rem] bg-[#fff8f1] p-2">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="h-4 w-4 rounded-full bg-primary-400" />
              <span className="h-1.5 w-10 rounded-full bg-primary-200" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-11 rounded-lg rounded-tl-sm bg-white" />
              <div className="ml-auto h-4 w-9 rounded-lg rounded-tr-sm bg-primary-300/80" />
              <div className="h-4 w-12 rounded-lg rounded-tl-sm bg-white" />
            </div>
            <div className="absolute bottom-3 left-1/2 h-1 w-7 -translate-x-1/2 rounded-full bg-primary-200" />
          </div>
        </div>
        <div className="absolute left-10 top-7 h-10 w-10 rounded-2xl bg-primary-300/25 blur-xl" />
        <div className="absolute right-12 bottom-6 h-14 w-14 rounded-full bg-primary-500/20 blur-2xl" />
      </div>
    );
  }

  if (type === 'web') {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,252,250,0.16),rgba(188,145,102,0.05))] p-6">
        <div className="h-full overflow-hidden rounded-2xl border border-primary-200/25 bg-white/12 shadow-2xl">
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/10 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-red-300" />
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span className="ml-auto h-2 w-20 rounded-full bg-white/18" />
          </div>
          <div className="grid h-full grid-cols-[56px_1fr]">
            <div className="space-y-2 border-r border-white/10 bg-primary-900/35 p-2">
              <span className="block h-8 w-8 rounded-xl bg-primary-400" />
              <span className="block h-8 w-8 rounded-xl bg-white/10" />
              <span className="block h-8 w-8 rounded-xl bg-white/10" />
            </div>
            <div className="p-3">
              <div className="mb-3 h-5 w-28 rounded-full bg-white/18" />
              <div className="grid grid-cols-3 gap-2">
                <span className="h-16 rounded-xl bg-primary-300/35" />
                <span className="h-16 rounded-xl bg-white/14" />
                <span className="h-16 rounded-xl bg-primary-500/24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,252,250,0.16),rgba(188,145,102,0.04))] p-6">
      <div className="relative h-full">
        <div className="absolute left-2 top-2 h-24 w-40 overflow-hidden rounded-2xl border border-primary-200/25 bg-white/12 shadow-xl">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-red-300" />
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
          </div>
          <div className="space-y-2 p-3">
            <div className="h-3 w-24 rounded-full bg-white/20" />
            <div className="h-3 w-16 rounded-full bg-primary-300/40" />
          </div>
        </div>
        <div className="absolute bottom-0 right-1 h-24 w-36 rounded-2xl border border-primary-200/25 bg-primary-900/42 p-3 shadow-2xl">
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary-300" />
            <span className="h-2 w-16 rounded-full bg-white/20" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 rounded-lg bg-white/14" />
            <div className="ml-auto h-4 w-20 rounded-lg bg-primary-300/35" />
          </div>
        </div>
      </div>
    </div>
  );
};

const PlatformCard = ({ icon: Icon, title, sub, preview, action }: PlatformCardProps) => (
  <div
    className="group relative rounded-2xl overflow-hidden text-left transition-all duration-500 hover-lift"
    style={{
      background: 'rgba(255,252,250,0.06)',
      border: '1px solid rgba(223,192,164,0.15)',
    }}
  >
    <div className="relative h-40 overflow-hidden">
      <PlatformPreview type={preview} />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-900/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
        download={action.download}
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
