import { MessageCircle, Video, Shield, Users, QrCode, Globe } from 'lucide-react';
import type { LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  bg: string;
};

const FEATURES: Feature[] = [
  {
    icon: MessageCircle,
    title: 'Nhắn tin nhanh chóng',
    description: 'Gửi tin nhắn, hình ảnh, video tức thì. Hỗ trợ nhóm lên đến 500 người.',
    accent: 'var(--color-primary-500)',
    bg: 'var(--color-primary-50)',
  },
  {
    icon: Video,
    title: 'Gọi video HD',
    description: 'Chất lượng cao, ổn định ngay cả khi mạng yếu. Nhóm video lên đến 50 người.',
    accent: 'var(--color-primary-600)',
    bg: 'var(--color-primary-100)',
  },
  {
    icon: Shield,
    title: 'Bảo mật tuyệt đối',
    description: 'Mã hóa end-to-end, xác thực 2 lớp, quản lý thiết bị đăng nhập.',
    accent: 'var(--color-primary-700)',
    bg: 'var(--color-primary-50)',
  },
  {
    icon: Users,
    title: 'Nhóm & Cộng đồng',
    description: 'Tạo nhóm chat, kênh cộng đồng để kết nối bạn bè và đồng nghiệp.',
    accent: 'var(--color-primary-500)',
    bg: 'var(--color-primary-100)',
  },
  {
    icon: QrCode,
    title: 'Đăng nhập QR Code',
    description: 'Quét mã QR — đăng nhập ngay lập tức, không cần nhập mật khẩu.',
    accent: 'var(--color-primary-600)',
    bg: 'var(--color-primary-50)',
  },
  {
    icon: Globe,
    title: 'Đa nền tảng',
    description: 'Web, iOS, Android, Windows, macOS. Đồng bộ tin nhắn trên mọi thiết bị.',
    accent: 'var(--color-primary-700)',
    bg: 'var(--color-primary-100)',
  },
];

type FeatureCardProps = Feature & { index: number };

const FeatureCard = ({ icon: Icon, title, description, accent, bg, index }: FeatureCardProps) => (
  <div
    className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover-lift"
    style={{
      background: bg,
      border: '1px solid var(--color-primary-200)',
      animationDelay: `${index * 75}ms`,
    }}
  >
    {/* Product-style preview strip */}
    <div className="relative h-44 overflow-hidden bg-white/70 p-4">
      <div className="h-full rounded-2xl border border-primary-100 bg-white p-4 shadow-sm transition-transform duration-500 group-hover:-translate-y-1">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: accent }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="h-2.5 w-24 rounded-full bg-primary-100" />
            <div className="h-2 w-16 rounded-full bg-primary-50" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="h-8 w-4/5 rounded-2xl rounded-tl-md bg-primary-50" />
          <div className="ml-auto h-8 w-3/5 rounded-2xl rounded-tr-md bg-primary-200/80" />
          <div className="h-8 w-2/3 rounded-2xl rounded-tl-md bg-primary-50" />
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="p-6">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ background: accent }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3
        className="text-base font-semibold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-900)' }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-primary-600)' }}>
        {description}
      </p>
    </div>

    {/* Hover accent line */}
    <div
      className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500"
      style={{ background: accent }}
    />
  </div>
);

const FeaturesSection = () => (
  <section id="features" className="py-28" style={{ background: '#faf7f4' }}>
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="max-w-xl mb-16">
        <p
          className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: 'var(--color-primary-500)' }}
        >
          Tính năng
        </p>
        <h2
          className="text-4xl md:text-5xl font-bold leading-tight mb-4"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-900)' }}
        >
          Mọi thứ bạn cần
          <br />
          trong một ứng dụng
        </h2>
        <p className="text-base leading-relaxed" style={{ color: 'var(--color-primary-600)' }}>
          Từ nhắn tin cá nhân đến cộng đồng hàng nghìn người — Riff được thiết kế cho mọi nhu cầu giao tiếp.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature, index) => (
          <FeatureCard key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
