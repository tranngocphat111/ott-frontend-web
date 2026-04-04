import { ArrowRight, ChevronDown } from 'lucide-react';

type Stat = {
  value: string;
  label: string;
};

const STATS: Stat[] = [
  { value: '100M+', label: 'Người dùng' },
  { value: '50M+', label: 'Tin nhắn / ngày' },
  { value: '99.9%', label: 'Uptime' },
];

const GrainOverlay = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <filter id="grain-hero">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain-hero)" />
  </svg>
);

const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(160deg, var(--color-primary-50) 0%, #fff9f5 45%, var(--color-primary-100) 100%)',
      }}
    >
      <GrainOverlay />

      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--color-primary-300) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--color-primary-400) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      {/* Floating image — xl screens */}
      <div
        className="absolute right-8 top-32 hidden xl:block w-64 h-80 rounded-2xl overflow-hidden shadow-xl rotate-3 hover-lift"
        style={{ border: '1px solid var(--color-primary-200)' }}
      >
        <img
          src="/images/hero-float-1.jpg"
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = 'none';
            if (el.parentElement) el.parentElement.style.background = 'var(--color-primary-100)';
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative max-w-5xl mx-auto px-6 py-40 text-center">
        {/* Badge */}
        <div
          className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-8"
          style={{
            background: 'var(--color-primary-100)',
            color: 'var(--color-primary-700)',
            border: '1px solid var(--color-primary-200)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-slow" />
          Ứng dụng nhắn tin số 1 Việt Nam
        </div>

        {/* Heading */}
        <h1
          className="animate-slide-up delay-75 text-[clamp(2.8rem,8vw,6rem)] font-bold leading-[1.05] tracking-tight mb-6"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-900)' }}
        >
          Kết nối mọi người,
          <br />
          <em className="not-italic" style={{ color: 'var(--color-primary-500)' }}>
            mọi lúc, mọi nơi
          </em>
        </h1>

        {/* Sub */}
        <p
          className="animate-slide-up delay-150 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10"
          style={{ color: 'var(--color-primary-600)', fontFamily: 'var(--font-body)' }}
        >
          Nhắn tin nhanh, gọi video HD, bảo mật tuyệt đối —
          trải nghiệm giao tiếp được thiết kế cho bạn.
        </p>

        {/* CTAs */}
        <div className="animate-slide-up delay-225 flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <a
            href="/register"
            className="btn-ripple transition-base group flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white rounded-xl shadow-md hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))' }}
          >
            Đăng ký miễn phí
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </a>
          <a
            href="/login"
            className="transition-base px-7 py-3.5 text-sm font-semibold rounded-xl"
            style={{
              color: 'var(--color-primary-700)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-primary-200)',
            }}
          >
            Đăng nhập ngay
          </a>
        </div>

        {/* Stats */}
        <div
          className="animate-fade-in delay-300 grid grid-cols-3 gap-px rounded-2xl overflow-hidden max-w-lg mx-auto"
          style={{ background: 'var(--color-primary-200)' }}
        >
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center py-5"
              style={{ background: 'var(--color-surface-raised)' }}
            >
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-700)' }}
              >
                {value}
              </span>
              <span className="text-xs mt-0.5" style={{ color: 'var(--color-primary-500)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Hero image */}
        <div
          className="animate-fade-in delay-450 mt-16 rounded-2xl overflow-hidden shadow-xl mx-auto max-w-3xl aspect-video"
          style={{ border: '1px solid var(--color-primary-200)' }}
        >
          <img
            src="/images/hero-main.jpg"
            alt="Riff app screenshot"
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.parentElement) {
                el.parentElement.style.background = 'var(--color-primary-100)';
              }
              el.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6" style={{ color: 'var(--color-primary-400)' }} />
      </div>
    </section>
  );
};

export default HeroSection;