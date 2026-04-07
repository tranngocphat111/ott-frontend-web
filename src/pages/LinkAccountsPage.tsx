// pages/LinkAccountsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Chrome, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { otpApi } from '../services/api/otp.api';
import { linkingApi } from '../services/api/linking.api';
import Header from '../components/Header';

export const LinkAccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Email linking
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // Phone linking
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  const handleRequestEmailOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      await otpApi.requestLinkEmailOtp(email);
      setEmailOtpSent(true);
      setSuccess('Mã OTP đã được gửi đến email của bạn');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await linkingApi.linkEmail(email, emailOtp);
      setSuccess('Liên kết email thành công!');
      await refreshUser();
      setShowEmailForm(false);
      setEmailOtpSent(false);
      setEmail('');
      setEmailOtp('');
    } catch (err: any) {
      setError(err.message || 'Liên kết email thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPhoneOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      await otpApi.requestLinkPhoneOtp(phone);
      setPhoneOtpSent(true);
      setSuccess('Mã OTP đã được gửi đến số điện thoại của bạn');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await linkingApi.linkPhone(phone, phoneOtp);
      setSuccess('Liên kết số điện thoại thành công!');
      await refreshUser();
      setShowPhoneForm(false);
      setPhoneOtpSent(false);
      setPhone('');
      setPhoneOtp('');
    } catch (err: any) {
      setError(err.message || 'Liên kết số điện thoại thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} />
            <span>Quay lại</span>
          </button>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Liên kết tài khoản</h1>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
                {success}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="text-blue-600" size={24} />
                    <div>
                      <p className="font-semibold">Email</p>
                      {user?.isEmailVerified ? (
                        <p className="text-sm text-gray-600">{user.email}</p>
                      ) : (
                        <p className="text-sm text-gray-500">Chưa liên kết</p>
                      )}
                    </div>
                  </div>
                  {user?.isEmailVerified ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <button
                      onClick={() => setShowEmailForm(!showEmailForm)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Liên kết
                    </button>
                  )}
                </div>

                {showEmailForm && !user?.isEmailVerified && (
                  <form onSubmit={handleLinkEmail} className="mt-4 space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập email"
                      required
                      disabled={emailOtpSent}
                    />
                    {!emailOtpSent ? (
                      <button
                        type="button"
                        onClick={handleRequestEmailOtp}
                        disabled={loading || !email}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Gửi mã OTP
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nhập mã OTP"
                          required
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? 'Đang xác nhận...' : 'Xác nhận'}
                        </button>
                      </>
                    )}
                  </form>
                )}
              </div>

              {/* Phone */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="text-green-600" size={24} />
                    <div>
                      <p className="font-semibold">Số điện thoại</p>
                      {user?.isPhoneVerified ? (
                        <p className="text-sm text-gray-600">{user.phone}</p>
                      ) : (
                        <p className="text-sm text-gray-500">Chưa xác thực</p>
                      )}
                    </div>
                  </div>
                  {user?.isPhoneVerified ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <button
                      onClick={() => setShowPhoneForm(!showPhoneForm)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Xác thực
                    </button>
                  )}
                </div>

                {showPhoneForm && !user?.isPhoneVerified && (
                  <form onSubmit={handleLinkPhone} className="mt-4 space-y-3">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập số điện thoại"
                      required
                      disabled={phoneOtpSent}
                    />
                    {!phoneOtpSent ? (
                      <button
                        type="button"
                        onClick={handleRequestPhoneOtp}
                        disabled={loading || !phone}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Gửi mã OTP
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nhập mã OTP"
                          required
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          {loading ? 'Đang xác nhận...' : 'Xác nhận'}
                        </button>
                      </>
                    )}
                  </form>
                )}
              </div>

              {/* Google */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Chrome className="text-red-600" size={24} />
                    <div>
                      <p className="font-semibold">Google</p>
                      {user?.hasGoogleLinked ? (
                        <p className="text-sm text-gray-600">Đã liên kết</p>
                      ) : (
                        <p className="text-sm text-gray-500">Chưa liên kết</p>
                      )}
                    </div>
                  </div>
                  {user?.hasGoogleLinked ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <button
                      onClick={() => alert('Tính năng liên kết Google đang được phát triển')}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Liên kết
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkAccountsPage;