import { MessageCircle, Video, Shield, Users, QrCode, Globe } from 'lucide-react';
import type { LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  bg: string;
  image: string;
};

const FEATURES: Feature[] = [
  {
    icon: MessageCircle,
    title: 'Nhắn tin nhanh chóng',
    description: 'Gửi tin nhắn, hình ảnh, video tức thì. Hỗ trợ nhóm lên đến 500 người.',
    accent: 'var(--color-primary-500)',
    bg: 'var(--color-primary-50)',
    image: '/images/feature-chat.jpg',
  },
  {
    icon: Video,
    title: 'Gọi video HD',
    description: 'Chất lượng cao, ổn định ngay cả khi mạng yếu. Nhóm video lên đến 50 người.',
    accent: 'var(--color-primary-600)',
    bg: 'var(--color-primary-100)',
    image: '/images/feature-video.jpg',
  },
  {
    icon: Shield,
    title: 'Bảo mật tuyệt đối',
    description: 'Mã hóa end-to-end, xác thực 2 lớp, quản lý thiết bị đăng nhập.',
    accent: 'var(--color-primary-700)',
    bg: 'var(--color-primary-50)',
    image: '/images/feature-security.jpg',
  },
  {
    icon: Users,
    title: 'Nhóm & Cộng đồng',
    description: 'Tạo nhóm chat, kênh cộng đồng để kết nối bạn bè và đồng nghiệp.',
    accent: 'var(--color-primary-500)',
    bg: 'var(--color-primary-100)',
    image: '/images/feature-groups.jpg',
  },
  {
    icon: QrCode,
    title: 'Đăng nhập QR Code',
    description: 'Quét mã QR — đăng nhập ngay lập tức, không cần nhập mật khẩu.',
    accent: 'var(--color-primary-600)',
    bg: 'var(--color-primary-50)',
    image: '/images/feature-qr.jpg',
  },
  {
    icon: Globe,
    title: 'Đa nền tảng',
    description: 'Web, iOS, Android, Windows, macOS. Đồng bộ tin nhắn trên mọi thiết bị.',
    accent: 'var(--color-primary-700)',
    bg: 'var(--color-primary-100)',
    image: '/images/feature-platform.jpg',
  },
];

type FeatureCardProps = Feature & { index: number };

const FeatureCard = ({ icon: Icon, title, description, accent, bg, image, index }: FeatureCardProps) => (
  <div
    className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover-lift"
    style={{
      background: bg,
      border: '1px solid var(--color-primary-200)',
      animationDelay: `${index * 75}ms`,
    }}
  >
    {/* Image strip */}
    <div className="relative h-44 overflow-hidden">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = 'none';
          if (el.parentElement) el.parentElement.style.background = 'var(--color-primary-200)';
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(35,26,16,0.15), transparent)' }}
      />
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