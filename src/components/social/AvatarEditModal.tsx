import React, { useRef } from "react";
import { Camera, Check, X, Loader2 } from "lucide-react";
import avatar from "../../assets/avatar.png";

interface AvatarEditModalProps {
  isOpen: boolean;
  currentAvatar?: string;
  avatarPreview: string | null;
  avatarSaving: boolean;
  onClose: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  avatarFile: File | null;
}

const AvatarEditModal: React.FC<AvatarEditModalProps> = ({
  isOpen,
  currentAvatar,
  avatarPreview,
  avatarSaving,
  onClose,
  onFileChange,
  onSave,
  avatarFile,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Đổi ảnh đại diện
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition">
            <X className="size-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center">
          <div className="size-36 rounded-full overflow-hidden border-4 border-primary-100 shadow">
            {avatarPreview ?
              <img
                src={avatarPreview}
                alt="preview"
                className="size-full object-cover"
              />
            : currentAvatar ?
              <img
                src={currentAvatar}
                alt="current"
                className="size-full object-cover"
              />
            : <img
                src={avatar}
                alt="default"
                className="size-full object-cover"
              />
            }
          </div>
        </div>

        {/* File input trigger */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          onClick={() => avatarInputRef.current?.click()}
          className="w-full border-2 border-dashed border-primary-300 text-primary-500 font-medium py-2.5 rounded-xl hover:bg-primary-50 transition text-sm flex items-center justify-center gap-2">
          <Camera className="size-4" />
          Chọn ảnh từ thiết bị
        </button>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition">
            Huỷ
          </button>
          <button
            onClick={onSave}
            disabled={!avatarFile || avatarSaving}
            className="flex-1 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-40 transition flex items-center justify-center gap-1.5">
            {avatarSaving ?
              <Loader2 className="size-4 animate-spin" />
            : <Check className="size-4" />}
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarEditModal;
