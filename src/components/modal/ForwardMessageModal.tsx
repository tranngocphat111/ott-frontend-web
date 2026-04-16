import React, { useMemo, useState } from "react";
import { Search, X, CheckCircle2 } from "lucide-react";
import type { ConversationWithParticipant, Message } from "../../types";
import { getConversationDisplayName } from "../../utils";

interface ForwardMessageModalProps {
  isOpen: boolean;
  message: Message | null;
  conversations: ConversationWithParticipant[];
  currentConversationId?: string;
  currentUserId?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (conversationIds: string[]) => Promise<void> | void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  message,
  conversations,
  currentConversationId,
  currentUserId,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");

  const normalizedList = useMemo(() => {
    return conversations
      .filter((item) => item?.conversation?._id)
      .map((item) => {
        const name =
          getConversationDisplayName(item.conversation, currentUserId) ||
          "Hội thoại";
        return {
          id: String(item.conversation._id),
          name,
          type: item.conversation.type,
        };
      })
      .sort((a, b) => {
        if (a.id === currentConversationId) return -1;
        if (b.id === currentConversationId) return 1;
        return a.name.localeCompare(b.name, "vi");
      });
  }, [conversations, currentConversationId, currentUserId]);

  const filteredList = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return normalizedList;
    return normalizedList.filter((item) =>
      item.name.toLowerCase().includes(query),
    );
  }, [keyword, normalizedList]);

  if (!isOpen || !message) return null;

  const previewText = (() => {
    if (message.type === "image") return "[Hình ảnh]";
    if (message.type === "video") return "[Video]";
    if (message.type === "audio") return "[Âm thanh]";
    if (message.type === "file") return "[Tệp tin]";
    const raw = Array.isArray(message.content)
      ? String(message.content[0] || "")
      : String(message.content || "");
    return raw || "[Tin nhắn]";
  })();

  const toggleSelect = (conversationId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(conversationId)) {
        return prev.filter((id) => id !== conversationId);
      }
      return [...prev, conversationId];
    });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setKeyword("");
    setSelectedIds([]);
    onClose();
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    await onConfirm(selectedIds);
    setKeyword("");
    setSelectedIds([]);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Chuyển tiếp tin nhắn
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="text-[12px] uppercase tracking-wide text-slate-500 mb-1.5">
            Nội dung chuyển tiếp
          </div>
          <div className="text-sm text-slate-800 truncate">{previewText}</div>
        </div>

        <div className="px-6 py-4">
          <div className="relative mb-3">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm bạn bè hoặc nhóm"
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
            {filteredList.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                Không tìm thấy hội thoại phù hợp
              </div>
            )}

            {filteredList.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSelect(item.id)}
                  className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "border-primary-400 bg-primary-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {item.name}
                    </div>
                    <div className="text-[12px] text-slate-500">
                      {item.type === "group" ? "Nhóm" : "Bạn bè"}
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 size={18} className="text-primary-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={selectedIds.length === 0 || isSubmitting}
            className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Đang chuyển tiếp..."
              : `Chuyển tiếp (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
