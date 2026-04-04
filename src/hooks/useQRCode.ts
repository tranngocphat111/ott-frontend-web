import { useState, useEffect, useRef } from 'react';
import { qrApi } from '../services/api/qr.api';
import { QrCodeStatus } from '../types/enums';
import type { ApiError, QrCodeResponse, QrStatusResponse } from '../types';

export const useQRCode = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState<QrCodeResponse | null>(null);
  const [qrStatus, setQrStatus] = useState<QrStatusResponse | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const generateQRCode = async () => {
    stopPolling();
    setLoading(true);
    setError('');
    setQrStatus(null);
    try {
      const response = await qrApi.generateQrCode();

      if (response.result) {
        setQrCode(response.result);
        return response.result;
      }

      throw new Error('Tạo QR code thất bại');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Không thể tạo QR code. Vui lòng thử lại.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkQRStatus = async (qrId: string) => {
    try {
      const response = await qrApi.checkQrStatus(qrId);

      if (response.result) {
        setQrStatus(response.result);
        return response.result;
      }
    } catch (err) {
      console.error('Check QR status error:', err);
    }
    return null;
  };

  const cancelQRCode = async (qrId: string) => {
    stopPolling();
    try {
      await qrApi.cancelQrCode(qrId);
    } catch (err) {
      console.error('Cancel QR code error:', err);
    } finally {
      setQrCode(null);
      setQrStatus(null);
    }
  };

  // Auto polling
  useEffect(() => {
    if (!qrCode?.qrId) return;

    intervalRef.current = setInterval(async () => {
      const status = await checkQRStatus(qrCode.qrId);

      if (
        status &&
        [QrCodeStatus.EXPIRED, QrCodeStatus.CANCELLED, QrCodeStatus.CONFIRMED].includes(
          status.status
        )
      ) {
        stopPolling();
      }
    }, 2000);

    return () => stopPolling();
  }, [qrCode?.qrId]); // chỉ restart polling khi qrId thay đổi

  return {
    qrCode,
    qrStatus,
    generateQRCode,
    checkQRStatus,
    cancelQRCode,
    loading,
    error,
    clearError: () => setError(''),
  };
};