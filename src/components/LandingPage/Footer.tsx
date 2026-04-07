import { MessageCircle, Mail, Phone } from 'lucide-react';

type LinkItem = {
  label: string;
  href: string;
};

type LinkGroup = {
  title: string;
  items: LinkItem[];
};

const LINK_GROUPS: LinkGroup[] = [
  {
    title: 'Sản phẩm',
    items: [
      { label: 'Tính năng', href: '#features' },
      { label: 'Bảo mật', href: '#security' },
      { label: 'Tải về', href: '#download' },
      { label: 'Cập nhật mới', href: '#' },
    ],
  },
  {
    title: 'Hỗ trợ',
    items: [
      { label: 'Trung tâm trợ giúp', href: '#' },
      { label: 'Liên hệ', href: '#' },
      { label: 'Báo cáo lỗi', href: '#' },
      { label: 'Cộng đồng', href: '#' },
    ],
  },
  {
    title: 'Pháp lý',
    items: [
      { label: 'Điều khoản dịch vụ', href: '#' },
      { label: 'Chính sách bảo mật', href: '#' },
      { label: 'Cookie', href: '#' },
    ],
  },
];

const Footer = () => (
  <footer style={{ background: 'var(--color-primary-900)' }}>
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
        {/* Brand */}
        <div className="lg:col-span-2">
          <a href="/" className="flex items-center gap-2.5 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-primary-600)' }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-100)' }}
            >
              riff
            </span>
          </a>
          <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-primary-400)' }}>
            Kết nối mọi người, mọi lúc, mọi nơi.
            <br />
            Được thiết kế cho người Việt.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="mailto:hello@riff.vn"
              className="flex items-center gap-2 text-sm transition-colors duration-200 hover:text-white"
              style={{ color: 'var(--color-primary-400)' }}
            >
              <Mail className="w-4 h-4" />
              hello@riff.vn
            </a>
            <a
              href="tel:+84900000000"
              className="flex items-center gap-2 text-sm transition-colors duration-200 hover:text-white"
              style={{ color: 'var(--color-primary-400)' }}
            >
              <Phone className="w-4 h-4" />
              0900 000 000
            </a>
          </div>
        </div>

        {/* Link columns */}
        {LINK_GROUPS.map(({ title, items }) => (
          <div key={title}>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-primary-500)' }}
            >
              {title}
            </h4>
            <ul className="space-y-2.5">
              {items.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm transition-colors duration-200 hover:text-white"
                    style={{ color: 'var(--color-primary-400)' }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="flex flex-col md:flex-row items-center justify-between gap-3 pt-8 text-xs"
        style={{
          borderTop: '1px solid rgba(223,192,164,0.1)',
          color: 'var(--color-primary-600)',
        }}
      >
        <span>Riff</span>
        
      </div>
    </div>
  </footer>
);

export default Footer;