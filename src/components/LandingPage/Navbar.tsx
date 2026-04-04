import { useState, useEffect } from 'react';
import {  Menu, X } from 'lucide-react';
import logo from '../../assets/logo_tach_nen.jpg';

type NavItem = {
  id: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'features', label: 'Tính năng' },
  { id: 'security', label: 'Bảo mật' },
  { id: 'download', label: 'Tải về' },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-white/95 backdrop-blur-md border-b border-primary-100 shadow-sm'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-xl bg-white from-primary-600 to-primary-400 flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105">
            <img
              src={logo}
              alt="logo"
              className="w-7 h-7 object-contain"
            />
          </div>
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary-800)' }}
          >
            Riff
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="text-sm font-medium text-primary-700 hover:text-primary-500 transition-colors duration-200"
            >
              {label}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="px-5 py-2 text-sm font-medium text-primary-700 hover:text-primary-500 transition-colors duration-200"
          >
            Đăng nhập
          </a>
          <a
            href="/register"
            className="btn-ripple transition-base px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))' }}
          >
            Đăng ký
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-primary-50 text-primary-700 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-slide-down bg-white/97 backdrop-blur-md border-t border-primary-100 px-6 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="block w-full text-left px-3 py-2.5 text-sm font-medium text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
            >
              {label}
            </button>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-primary-100">
            <a
              href="/login"
              className="px-3 py-2.5 text-sm text-primary-700 hover:bg-primary-50 rounded-lg text-center transition-colors"
            >
              Đăng nhập
            </a>
            <a
              href="/register"
              className="px-3 py-2.5 text-sm font-semibold text-white rounded-lg text-center"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))' }}
            >
              Đăng ký miễn phí
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;