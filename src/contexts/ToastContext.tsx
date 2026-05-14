import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  leaving?: boolean;
}

interface ToastCtx {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastCtx>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={15} />,
  error:   <XCircle size={15} />,
  info:    <Info size={15} />,
  warning: <Info size={15} />,
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const dur = toast.duration ?? 4500;

  return (
    <div className={`toast toast--${toast.type}${toast.leaving ? ' toast--leaving' : ''}`}
      style={{ '--toast-duration': `${dur}ms` } as React.CSSProperties}
    >
      <div className="toast__icon">{ICONS[toast.type]}</div>
      <div className="toast__body">
        {toast.title && <div className="toast__title">{toast.title}</div>}
        <div className="toast__message">{toast.message}</div>
      </div>
      <button className="toast__close" onClick={() => onDismiss(toast.id)}>
        <X size={14} />
      </button>
      <div className="toast__progress" />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(p => p.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 300);
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    title?: string,
    duration = 4500,
  ) => {
    const id = crypto.randomUUID();
    setToasts(p => [...p, { id, type, message, title, duration }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" style={{ fontFamily: 'var(--font-body)' }}>
        {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
}
