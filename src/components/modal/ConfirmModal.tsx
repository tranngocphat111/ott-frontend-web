import React from "react";
import { X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Gỡ",
  cancelText = "Hủy",
  isDangerous = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-primary-50 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-primary-200 animate-scale-in">
        {/* Close button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-primary-900 font-semibold text-lg">{title}</h2>
          <button
            onClick={onCancel}
            className="text-primary-400 hover:text-primary-600 transition-colors p-1"
            title="Đóng"
          >
            <X size={24} />
          </button>
        </div>

        {/* Message */}
        <p className="text-primary-700 text-sm mb-8 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-primary-600 hover:bg-primary-100 transition-colors font-medium text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl font-semibold text-sm text-white shadow-sm transition-all active:scale-95 ${
              isDangerous
                ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                : "bg-primary-500 hover:bg-primary-600 shadow-primary-200"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
