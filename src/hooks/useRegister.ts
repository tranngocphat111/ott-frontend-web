import { useState } from 'react';
import { userApi } from '../services/api';

type Step = 'form' | 'otp';

type FormData = {
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  otp: string;
};

const INITIAL_FORM: FormData = {
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  otp: '',
};

export const useRegister = () => {
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validateForm = (): string => {
    const { phone, email, password, confirmPassword, fullName } = formData;
    if (!phone || !email || !password || !fullName) return 'Vui lòng điền đầy đủ thông tin';
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    return '';
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const response = await userApi.requestRegisterOtp(
        formData.phone,
        formData.email,
        formData.fullName
      );
      setSuccess(response.result?.message || 'OTP đã được gửi về email của bạn');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.otp || formData.otp.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 số');
      return;
    }

    setLoading(true);
    try {
      await userApi.register({
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        otp: formData.otp,
      });
      setSuccess('Đăng ký thành công! Chuyển đến trang đăng nhập...');
      setTimeout(() => (window.location.href = '/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('form');
    setError('');
    setSuccess('');
  };

  return {
    step,
    formData,
    loading,
    error,
    success,
    handleChange,
    handleRequestOtp,
    handleRegister,
    goBack,
  };
};