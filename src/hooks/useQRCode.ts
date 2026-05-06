import { useState, useEffect, useRef, useCallback } from 'react';
import { qrApi } from '../services/api/qr.api';
import { QrCodeStatus } from '../types/enums';
import type { ApiError, QrCodeResponse, QrStatusResponse } from '../types';
import { useToast } from '../contexts/ToastContext';
import { API_CONFIG } from '../config/api';

export const useQRCode = () => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState<QrCodeResponse | null>(null);
  const [qrStatus, setQrStatus] = useState<QrStatusResponse | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const closeWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const checkQRStatus = useCallback(async (qrId: string) => {
    try {
      const response = await qrApi.checkQrStatus(qrId);

      if (response.result) {
        setQrStatus(response.result);
        return response.result;
      }
    } catch (err) {
      console.error('Lỗi khi kiểm tra trạng thái QR:', err);
    }
    return null;
  }, []);

  const generateQRCode = useCallback(async () => {
    closeWebSocket();
    setLoading(true);
    setError('');
    setQrStatus(null);

    try {
      const response = await qrApi.generateQrCode();

      if (response.result) {
        setQrCode(response.result);
        return response.result;
      }

      throw new Error('Định dạng dữ liệu trả về không hợp lệ');
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Không thể tạo mã QR. Vui lòng kiểm tra lại kết nối.';

      setError(errorMessage);
      showToast(errorMessage, 'error', 'Lỗi tạo QR'); 

      throw err;
    } finally {
      setLoading(false);
    }
  }, [closeWebSocket, showToast]);

  const cancelQRCode = useCallback(async (qrId: string) => {
    closeWebSocket();
    try {
      await qrApi.cancelQrCode(qrId);
      showToast('Đã hủy mã QR thành công', 'success'); 
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Lỗi hệ thống: Không thể hủy mã QR lúc này.';

      showToast(errorMessage, 'error', 'Hủy thất bại'); 
      console.error('Cancel QR code error:', err);
    } finally {
      setQrCode(null);
      setQrStatus(null);
    }
  }, [closeWebSocket, showToast]);

  useEffect(() => {
    if (!qrCode?.qrId) return;

    const wsUrl = API_CONFIG.BASE_URL.replace(/^http/, 'ws') + `/auth/ws/qr?qrId=${qrCode.qrId}`;
    let isFinished = false;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectWebSocket = () => {
      if (isFinished) return;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (isFinished) return;
        try {
          const status = JSON.parse(event.data) as QrStatusResponse;
          setQrStatus(status);

          if (status.status === QrCodeStatus.CONFIRMED) {
            isFinished = true;
            showToast('Giao dịch thành công!', 'success');
            closeWebSocket();
          } else if (status.status === QrCodeStatus.EXPIRED) {
            isFinished = true;
            showToast('Mã QR đã hết hạn. Vui lòng tạo mã mới.', 'warning');
            closeWebSocket();
          } else if (status.status === QrCodeStatus.CANCELLED) {
            isFinished = true;
            closeWebSocket();
          }
        } catch (err) {
          console.error('Lỗi khi phân tích dữ liệu WebSocket:', err);
        }
      };

      ws.onclose = () => {
        if (!isFinished) {
          // Reconnect logic if dropped unexpectedly
          reconnectTimeout = setTimeout(() => {
            checkQRStatus(qrCode.qrId); // Check status in case we missed it while disconnected
            connectWebSocket();
          }, 2000);
        }
      };

      ws.onerror = (error) => {
        console.error('Lỗi WebSocket QR Code:', error);
      };
    };

    connectWebSocket();

    return () => {
      isFinished = true;
      clearTimeout(reconnectTimeout);
      closeWebSocket();
    };
  }, [qrCode?.qrId, closeWebSocket, showToast, checkQRStatus]);

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