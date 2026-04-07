import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAccount } from '../hooks/useAccount';
import { useAuth } from '../contexts/AuthContext';

const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setPassword, isLoading } = useAccount();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  // Redirect nếu đã có mật khẩu
  React.useEffect(() => {
    if (user?.hasPassword) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await setPassword({
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate('/profile');
      }, 1800);
    } catch (error) {
      console.error('Failed to set password:', error);
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-[var(--background-image-gradient-subtle)] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3 font-display">
            Đặt mật khẩu thành công!
          </h2>
          <p className="text-gray-600 mb-8">
            Mật khẩu đã được thiết lập. Bạn có thể sử dụng để đăng nhập.
          </p>
          <p className="text-sm text-gray-500">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-image-gradient-subtle)]">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-fast"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Quay lại</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl shadow-sm border border-[var(--color-primary-100)] p-8 md:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--color-primary-900)] mb-3 font-display">
              Đặt mật khẩu
            </h1>
            <p className="text-[var(--color-primary-600)] text-lg">
              Tạo mật khẩu để đăng nhập bằng số điện thoại
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-primary-700)] mb-2">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-primary-400)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full pl-11 pr-12 py-3.5 border rounded-2xl focus:ring-2 focus:ring-[var(--color-primary-400)] focus:border-transparent transition-base ${errors.password ? 'border-[var(--color-error-border)]' : 'border-[var(--color-primary-200)]'
                    }`}
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary-400)] hover:text-[var(--color-primary-600)]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-[var(--color-error-text)]">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-primary-700)] mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-primary-400)]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`w-full pl-11 pr-12 py-3.5 border rounded-2xl focus:ring-2 focus:ring-[var(--color-primary-400)] focus:border-transparent transition-base ${errors.confirmPassword ? 'border-[var(--color-error-border)]' : 'border-[var(--color-primary-200)]'
                    }`}
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary-400)] hover:text-[var(--color-primary-600)]"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-[var(--color-error-text)]">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-[var(--color-info-bg)] border border-[var(--color-info-border)] rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--color-info-text)] mb-3">
                Yêu cầu mật khẩu:
              </p>
              <ul className="text-sm text-[var(--color-info-text)] space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[var(--color-primary-500)] rounded-full mt-2 flex-shrink-0" />
                  Ít nhất 6 ký tự
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-[var(--color-primary-500)] rounded-full mt-2 flex-shrink-0" />
                  Nên có chữ hoa, chữ thường và số
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl font-semibold text-lg transition-all btn-ripple
                         disabled:opacity-50 disabled:cursor-not-allowed
                         bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-500)]
                         hover:brightness-105 text-white shadow-md"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Đang xử lý...
                </span>
              ) : (
                'Đặt mật khẩu'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetPasswordPage;