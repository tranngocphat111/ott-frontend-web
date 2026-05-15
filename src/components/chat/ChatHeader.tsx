// src/components/Chat/ChatHeader.tsx
import React, { useEffect } from "react";
import { Phone, Video, PanelRightOpen, PanelRightClose, Sparkles } from "lucide-react";
import Avatar from "../common/Avatar";
import type { ChatAreaProps } from "../../interfaces";
import {
  getConversationDisplayAvatar,
  getConversationDisplayName,
} from "../../utils";
import { usePresence } from "../../contexts/PresenceContext";
import type { Conversation } from "../../types";

interface ChatHeaderProps extends ChatAreaProps {
  onStartVoiceCall?: () => void;
  onStartVideoCall?: () => void;
  disableCallActions?: boolean;
  currentUserId?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  hideCallActions?: boolean;
  onSummarize?: () => void;
  isSummarizing?: boolean;
}

// ─── Helper: format last seen ────────────────────────────────────────────────
const formatLastSeen = (date: Date | null): string => {
  if (!date) return "Ngoại tuyến";
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  // < 1 phút
  if (diff < 60) return "Vừa hoạt động";

  // < 1 giờ
  if (diff < 3600) return `Hoạt động ${Math.floor(diff / 60)} phút trước`;

  // < 24 giờ (trong cùng ngày)
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay) return `Hoạt động ${Math.floor(diff / 3600)} giờ trước`;

  // Hôm qua
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Hoạt động hôm qua";

  // < 7 ngày
  if (diff < 7 * 86400) {
    return `Hoạt động ${Math.floor(diff / 86400)} ngày trước`;
  }

  // Cùng năm hoặc khác năm
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();

  if (y === now.getFullYear()) {
    return `Hoạt động ${d} thg ${m}`;
  }

  return `Hoạt động ${d} thg ${m} ${y}`;
};

// ─── Helper: lấy userId của người kia trong 1-1 chat ────────────────────────
const getOtherUserId = (conversation: Conversation, currentUserId?: string): string | null => {
  if (conversation.type !== "private") return null;
  const participants = conversation.participants ?? [];
  const other = participants.find(
    (p: any) => String(p.user_id ?? p._id) !== String(currentUserId)
  );
  return other ? String(other.user_id ?? other._id) : null;
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onStartVoiceCall,
  onStartVideoCall,
  disableCallActions = false,
  currentUserId,
  isSidebarOpen = false,
  onToggleSidebar,
  hideCallActions = false,
  onSummarize,
  isSummarizing = false,
}) => {
  const { isUserOnline, getLastSeen, watchUsers } = usePresence();

  // Làm mới UI mỗi 1 phút để cập nhật thời gian "truy cập cuối"
  const [, setTick] = React.useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getConversationName = (): string =>
    getConversationDisplayName(conversation, currentUserId);

  const getConversationAvatar = (): string | undefined =>
    getConversationDisplayAvatar(conversation, currentUserId);

  // Xác định userId của người kia (chỉ 1-1)
  const otherUserId = getOtherUserId(conversation, currentUserId);

  // Đăng ký theo dõi presence khi conversation thay đổi
  useEffect(() => {
    if (otherUserId) {
      watchUsers([otherUserId]);
    }
    // Với group, có thể watch tất cả members
    if (conversation.type === "group" && conversation.participants) {
      const ids = (conversation.participants as any[])
        .map((p: any) => String(p.user_id ?? p._id))
        .filter(Boolean);
      if (ids.length > 0) watchUsers(ids);
    }
  }, [otherUserId, conversation._id, watchUsers]);

  // ─── Tính trạng thái hiển thị ────────────────────────────────────────────
  let statusDot = false;
  let statusText = "";

  if (conversation.is_self_conversation) {
    statusDot = false;
    statusText = "";
  } else if (conversation.type === "private" && otherUserId) {
    statusDot = isUserOnline(otherUserId);
    if (statusDot) {
      statusText = "Đang hoạt động";
    } else {
      const lastSeen = getLastSeen(otherUserId);
      statusText = formatLastSeen(lastSeen);
    }
  } else if (conversation.type === "group") {
    const participants = conversation.participants ?? [];
    statusDot = false; // Hide dot for group member count display
    statusText = `${participants.length} thành viên`;
  }

  const canShowCallActions = !hideCallActions;
  const isGroupActiveCall =
    conversation.type === "group" && Boolean(conversation.is_calling);
  const isVideoCallDisabled =
    disableCallActions ||
    Boolean(conversation.is_calling);
  const videoCallTitle = isGroupActiveCall
    ? "Đang có cuộc gọi nhóm diễn ra"
    : conversation.is_calling
      ? "Đang có cuộc gọi diễn ra"
      : conversation.type === "group"
        ? "Gọi nhóm"
        : "Gọi video";
  const videoActionLabel = isGroupActiveCall
    ? "Tham gia"
    : conversation.type === "group"
      ? "Gọi nhóm"
      : "Gọi video";
  return (
    <div className="relative flex-none z-10">
      <div className="px-3 py-2.5 sm:px-6 sm:py-3 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between">
        {/* Left Section: Avatar & Info */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Avatar
            src={getConversationAvatar()}
            name={getConversationName()}
            size={44}
            className="ring-2 ring-white shadow-sm"
          />
          <div className="min-w-0">
            <h2 className="truncate font-bold text-gray-800 text-base sm:text-lg">
              {getConversationName()}
            </h2>
            {statusText && (
              <div className="flex items-center gap-2">
                {conversation.type !== "group" && (
                  <span
                    className={`w-2 h-2 rounded-full transition-colors duration-500 ${statusDot
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-300"
                      }`}
                  />
                )}
                <p
                  className={`text-xs font-medium transition-colors duration-500 ${statusDot ? "text-green-600" : "text-gray-500"
                    }`}
                >
                  {statusText}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex shrink-0 items-center gap-1 text-gray-600">
          {canShowCallActions && (
            <div className="hidden items-center gap-1 sm:flex">
              {/* Voice Call Button - Hidden for Groups */}
              {conversation.type !== "group" && (
                <button
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={onStartVoiceCall}
                  disabled={disableCallActions}
                  title="Gọi thoại"
                >
                  <Phone size={20} />
                </button>
              )}

              {/* Video Call Button */}
              <button
                className="p-2 hover:bg-gray-50 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed group relative"
                onClick={onStartVideoCall}
                disabled={isVideoCallDisabled}
                title={videoCallTitle}
              >
                <Video size={20} className={conversation.is_calling ? "text-gray-500" : ""} />
                {isGroupActiveCall && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 animate-pulse" />
                )}
              </button>
            </div>
          )}

          {canShowCallActions && (
            <div className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />
          )}

          {/* AI Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSummarize}
              disabled={isSummarizing}
              className={`p-2 hover:bg-gray-50 rounded-full transition-all duration-200 group relative ${isSummarizing ? "opacity-50" : ""}`}
              title="Tóm tắt hội thoại (AI)"
            >
              <Sparkles size={20} className={`${isSummarizing ? "animate-spin" : "text-primary-500"}`} />
              {isSummarizing && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                </span>
              )}
            </button>

          </div>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className={`p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer ${isSidebarOpen ? "bg-primary-50 text-primary-600" : ""
              }`}
            title={isSidebarOpen ? "Đóng thông tin" : "Mở thông tin"}
          >
            {isSidebarOpen ? (
              <PanelRightClose size={20} />
            ) : (
              <PanelRightOpen size={20} />
            )}
          </button>
        </div>
      </div>

      {canShowCallActions && (
        <div className="border-b border-gray-100 bg-white px-3 py-2 sm:hidden">
          <div
            className={`grid gap-2 ${
              conversation.type !== "group" ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {conversation.type !== "group" && (
              <button
                type="button"
                onClick={onStartVoiceCall}
                disabled={disableCallActions}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 transition-colors active:scale-[0.99] disabled:opacity-45"
                title="Gọi thoại"
              >
                <Phone size={17} />
                Gọi thoại
              </button>
            )}

            <button
              type="button"
              onClick={onStartVideoCall}
              disabled={isVideoCallDisabled}
              className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors active:scale-[0.99] disabled:opacity-45 ${
                isGroupActiveCall
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-gray-200 bg-gray-50 text-gray-700"
              }`}
              title={videoCallTitle}
            >
              <Video size={17} />
              {videoActionLabel}
            </button>
          </div>
        </div>
      )}

      {/* Active Call Banner (Group Call) */}
      {conversation.type === "group" && conversation.is_calling && (
        <div className="px-3 py-2 sm:px-6 bg-emerald-50/80 backdrop-blur-md border-b border-emerald-100 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Video size={16} fill="currentColor" />
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-[13px] font-bold text-emerald-700">
                Cuộc gọi video nhóm
              </p>
              <p className="text-[11px] text-emerald-600/80 font-medium">
                {conversation.call_participant_count ?? 1} người đang tham gia
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onStartVideoCall) onStartVideoCall();
            }}
            className="shrink-0 px-3 py-1.5 sm:px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold rounded-lg transition-all shadow-sm active:scale-95"
          >
            Tham gia
          </button>
        </div>
      )}
    </div>
  );
};
