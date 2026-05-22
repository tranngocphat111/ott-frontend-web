import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';

type Stat = {
  value: string;
  label: string;
};

const STATS: Stat[] = [
  { value: '100M+', label: 'Người dùng' },
  { value: '50M+', label: 'Tin nhắn / ngày' },
  { value: '99.9%', label: 'Uptime' },
];

const conversations = [
  { name: 'Nhóm đồ án IUH', text: 'Mình gửi file rồi nha', active: true },
  { name: 'Trần Ngọc Phát', text: 'Đang gọi video...', active: false },
  { name: 'My Documents', text: 'Ảnh đã được lưu', active: false },
];

const AppPreview = () => (
  <div className="relative mx-auto mt-16 w-full max-w-4xl">
    <div className="absolute -left-5 top-10 hidden w-48 rounded-2xl border border-primary-100 bg-white/95 p-4 shadow-lg lg:block">
      <div className="mb-3 flex items-center gap-2 text-primary-700">
        <Bell className="h-4 w-4" />
        <span className="text-xs font-semibold">Thông báo mới</span>
      </div>
      <p className="text-sm font-semibold text-primary-900">Nguyễn Văn C vừa gửi lời mời kết bạn.</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="h-7 w-7 rounded-full bg-primary-200" />
        <span className="h-2.5 flex-1 rounded-full bg-primary-100" />
      </div>
    </div>

    <div className="overflow-hidden rounded-3xl border border-primary-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-primary-100 bg-[#fffaf6] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
          <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
          <span className="h-3 w-3 rounded-full bg-[#22c55e]" />
        </div>
        <div className="h-2 w-28 rounded-full bg-primary-100" />
      </div>

      <div className="grid min-h-[420px] lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-primary-100 bg-[#fbf6f1] p-4 lg:block">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-md">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-900">Riff Chat</p>
              <p className="text-xs text-primary-500">Đồng bộ realtime</p>
            </div>
          </div>
          <div className="mb-4 h-10 rounded-2xl bg-white px-4 py-3 text-left text-xs text-primary-400 shadow-sm">
            Tìm kiếm...
          </div>
          <div className="space-y-2">
            {conversations.map((item) => (
              <div
                key={item.name}
                className={`rounded-2xl p-3 transition ${
                  item.active ? 'bg-white shadow-md ring-1 ring-primary-100' : 'bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-primary-200" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary-900">{item.name}</p>
                    <p className="truncate text-xs text-primary-500">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col bg-[#f4f6f8]">
          <header className="flex items-center justify-between border-b border-primary-100 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                IU
              </span>
              <div>
                <p className="font-bold text-primary-900">Nhóm đồ án IUH</p>
                <p className="text-xs text-emerald-600">5 thành viên đang hoạt động</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Video className="h-5 w-5" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Sparkles className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-4 p-5">
            <div className="max-w-[72%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm">
              Tôi vừa gửi link meeting và tài liệu. Mọi người xem giúp mình nha.
            </div>
            <div className="ml-auto max-w-[70%] rounded-2xl rounded-tr-md bg-primary-200 px-4 py-3 text-left text-sm text-primary-900 shadow-sm">
              Oke, mình đã nhận được. Lát nữa vào call review luôn.
            </div>
            <div className="max-w-xs rounded-2xl border border-primary-100 bg-white p-3 text-left shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary-900">Bảo mật đã bật</p>
                  <p className="text-xs text-primary-500">Tin nhắn được bảo vệ</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <Check className="h-4 w-4" />
                Đã xác minh phiên đăng nhập
              </div>
            </div>
          </div>

          <div className="border-t border-primary-100 bg-white p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-[#fbf6f1] px-4 py-3 text-sm text-primary-400">
              <MessageCircle className="h-5 w-5" />
              Nhập tin nhắn...
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HeroSection = () => {
  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-x-hidden"
      style={{
        background:
          'linear-gradient(160deg, var(--color-primary-50) 0%, #fffaf7 42%, #f2e7de 100%)',
      }}
    >
      <div className="relative mx-auto w-full max-w-7xl px-6 py-32 text-center lg:px-10 lg:py-40">
        <div
          className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase"
          style={{
            background: 'var(--color-primary-100)',
            color: 'var(--color-primary-700)',
            border: '1px solid var(--color-primary-200)',
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-slow" />
          Ứng dụng nhắn tin số 1 Việt Nam
        </div>

        <h1
          className="animate-slide-up delay-75 mb-6 text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-900)' }}
        >
          Kết nối mọi người,
          <br />
          <em className="not-italic" style={{ color: 'var(--color-primary-500)' }}>
            mọi lúc, mọi nơi
          </em>
        </h1>

        <p
          className="animate-slide-up delay-150 mx-auto mb-10 max-w-xl text-lg leading-relaxed md:text-xl"
          style={{ color: 'var(--color-primary-600)', fontFamily: 'var(--font-body)' }}
        >
          Nhắn tin nhanh, gọi video HD, bảo mật tuyệt đối - trải nghiệm giao tiếp được thiết kế cho bạn.
        </p>

        <div className="animate-slide-up delay-225 mb-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/register"
            className="btn-ripple transition-base group flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))' }}
          >
            Đăng ký miễn phí
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
          <a
            href="/login"
            className="transition-base rounded-xl px-7 py-3.5 text-sm font-semibold"
            style={{
              color: 'var(--color-primary-700)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-primary-200)',
            }}
          >
            Đăng nhập ngay
          </a>
        </div>

        <div
          className="animate-fade-in delay-300 mx-auto grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-2xl"
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
              <span className="mt-0.5 text-xs" style={{ color: 'var(--color-primary-500)' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <AppPreview />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6" style={{ color: 'var(--color-primary-400)' }} />
      </div>
    </section>
  );
};

export default HeroSection;
