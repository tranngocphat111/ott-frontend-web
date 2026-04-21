import { Phone, PhoneMissed, PhoneOff, Video } from "lucide-react";
import type { Message } from "../../../types";
import { MessageLayout } from "./MessageLayout";
import { getConversationDisplayAvatar, getConversationDisplayName } from "../../../utils";

const getCallMeta = (type: string) => {
  switch (type) {
    case "call_end":
      return { label: "Cuộc gọi đã kết thúc", Icon: PhoneOff };
    case "call_missed":
    case "call_cancel":
    case "call_no_answer":
    case "call_start":
    case "call_join":
      return { label: "Cuộc gọi nhỡ", Icon: PhoneMissed };
    default:
      return { label: "Cuộc gọi", Icon: Phone };
  }
};

export const CallMessage = ({
  msg,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  isTopBoundary,
  onDelete,
  conversation,
}: {
  msg: Message;
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  isTopBoundary?: boolean;
  onDelete?: (msg: Message) => void;
  conversation?: any;
}) => {
  const rawText = Array.isArray(msg.content)
    ? msg.content.join("")
    : String(msg.content || "");
  const normalizedType = String(msg.type || "").toLowerCase();
  if (normalizedType === "call_start" || normalizedType === "call_join") {
    return null;
  }

  const isVideoCall = /video/i.test(rawText);
  const isMissedCall =
    normalizedType === "call_missed" ||
    normalizedType === "call_cancel" ||
    normalizedType === "call_no_answer";
  const messageTime = new Date(
    String(msg.createdAt || (msg as { created_at?: string }).created_at || ""),
  );
  const callTimeLabel = Number.isNaN(messageTime.getTime())
    ? ""
    : messageTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const { label, Icon } = getCallMeta(normalizedType);

  const handleRecall = () => {
    const conversationId = String(msg.conversation_id || "");
    if (!conversationId) return;

    const avatar = conversation && currentUserId
      ? getConversationDisplayAvatar(conversation, currentUserId) || ""
      : "";

    const queryParams: Record<string, string> = {
      conversationId,
      type: isVideoCall ? "video" : "voice",
      action: "start",
      name: (conversation && currentUserId ? getConversationDisplayName(conversation, currentUserId) : "") || "Cuộc gọi",
      // Tránh truyền base64 quá dài gây lỗi HTTP 431
      avatar: avatar.startsWith("data:") ? "" : avatar,
    };

    const params = new URLSearchParams(queryParams);

    const callWindow = window.open(
      `/call?${params.toString()}`,
      "riff-call-window",
      "width=1180,height=760,menubar=no,toolbar=no,location=no,status=no",
    );

    if (!callWindow) {
      window.location.href = `/call?${params.toString()}`;
    }
  };

  return (
    <MessageLayout
      msg={msg}
      isMe={isMe}
      currentUserId={currentUserId}
      isFirst={isFirstInSequence}
      isLast={isLastInSequence}
      isTopBoundary={isTopBoundary}
      onDelete={onDelete}
    >
      {(borderRadius) => (
        <div
          className={`min-w-56 max-w-[320px] p-3 text-[13px] shadow-sm  transition-all ${isMe
              ? "bg-[var(--color-chat-me)] text-[var(--color-chat-me-text)] ]"
              : "bg-[var(--color-chat-other)] text-[var(--color-chat-other-text)] shadow-lg border-[var(--color-chat-other-border)]"
            } ${borderRadius}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isMissedCall
                  ? "bg-[var(--color-error-bg)] text-[var(--color-error-text)]"
                  : isMe
                    ? "bg-white/20 text-[var(--color-chat-me-text)]"
                    : "bg-[var(--color-primary-100)] text-[var(--color-primary-600)]"
                }`}
            >
              {isVideoCall ? <Video size={18} /> : <Icon size={18} />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-semibold leading-tight ">
                {isMissedCall
                  ? `Đã bỏ lỡ cuộc gọi ${isVideoCall ? "video" : "thoại"}`
                  : `Cuộc gọi ${isVideoCall ? "video" : "thoại"}`}
              </div>
              <div className="mt-1 text-[12px] opacity-70 font-medium">
                {isMissedCall ? callTimeLabel : (rawText.split(" - ")[1] || rawText || label)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRecall}
            disabled={!msg.conversation_id}
            className={`mt-3 w-full rounded-lg disabled:opacity-50 disabled:cursor-not-allowed py-2 text-[15px] font-semibold transition-all ${isMe
                ? "bg-[var(--color-primary-400)] text-white hover:bg-[var(--color-primary-500)]"
                : "bg-[var(--color-primary-100)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-200)]"
              }`}
            title="Gọi lại"
          >
            Gọi lại
          </button>
        </div>
      )}
    </MessageLayout>
  );
};
