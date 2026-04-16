import React, { useEffect, useMemo, useState } from "react";
import { MessageCircle, X, PinOff, Pin } from "lucide-react";
import type { Message } from "../../types";

interface ReplacePinnedModalProps {
  isOpen: boolean;
  pinnedMessages: Message[];
  pendingMessage: Message | null;
  getSenderName: (msg: Message) => string;
  getPreviewText: (msg: Message) => string;
  renderTypeVisual: (msg: Message, size?: "sm" | "md") => React.ReactNode;
  onClose: () => void;
  onConfirm: (messageToUnpin: Message) => Promise<void> | void;
}

export const ReplacePinnedModal: React.FC<ReplacePinnedModalProps> = ({
  isOpen,
  pinnedMessages,
  pendingMessage,
  getSenderName,
  getPreviewText,
  renderTypeVisual,
  onClose,
  onConfirm,
}) => {
  const [selectedId, setSelectedId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedPinned = useMemo(() => {
    return pinnedMessages.filter((item) => item?.msg_id || item?._id);
  }, [pinnedMessages]);

  useEffect(() => {
    if (!isOpen) return;

    const firstId = String(
      normalizedPinned[0]?.msg_id || normalizedPinned[0]?._id || "",
    );
    setSelectedId(firstId);
  }, [isOpen, normalizedPinned]);

  if (!isOpen || !pendingMessage) return null;

  const handleConfirm = async () => {
    const selectedMessage = normalizedPinned.find(
      (item) => String(item.msg_id || item._id) === selectedId,
    );

    if (!selectedMessage) return;

    setIsSubmitting(true);
    try {
      await onConfirm(selectedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50  px-4 transition-all duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Pin className="text-primary-500" size={20} />
            Đã đạt giới hạn 3 ghim
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-slate-500 mb-5">
            Bạn chỉ có thể ghim tối đa 3 tin nhắn trong cuộc trò chuyện này. Vui
            lòng chọn một tin nhắn để bỏ ghim và thay thế bằng tin nhắn mới.
          </p>

          {/* Pending Message Highlight */}
          <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-4 shadow-sm">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary-600">
              Tin nhắn mới sẽ ghim
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-primary-100/50 bg-white p-3 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <MessageCircle size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-900">
                  {renderTypeVisual(pendingMessage, "sm")}
                  <span className="truncate font-medium">
                    {getSenderName(pendingMessage)}:{" "}
                    {getPreviewText(pendingMessage)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* List to Unpin */}
          <div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Chọn tin nhắn để bỏ ghim
            </div>
            <div className="space-y-2.5 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
              {normalizedPinned.map((item) => {
                const itemId = String(item.msg_id || item._id || "");
                const isSelected = itemId === selectedId;

                return (
                  <button
                    key={itemId}
                    type="button"
                    onClick={() => setSelectedId(itemId)}
                    className={`group w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-primary-500 bg-primary-50/30 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {/* Custom Radio Button */}
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-primary-500 bg-primary-500"
                          : "border-slate-300 group-hover:border-slate-400"
                      }`}
                    >
                      {isSelected && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                        {renderTypeVisual(item, "sm")}
                        <span
                          className={`truncate ${isSelected ? "font-medium text-slate-900" : ""}`}
                        >
                          {getSenderName(item)}: {getPreviewText(item)}
                        </span>
                      </div>
                    </div>

                    {/* Unpin Icon Hint */}
                    {isSelected && (
                      <div className="shrink-0 text-primary-500 animate-in zoom-in duration-200">
                        <PinOff size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!selectedId || isSubmitting}
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting ? <>Đang cập nhật...</> : <>Cập nhật ghim</>}
          </button>
        </div>
      </div>
    </div>
  );
};
