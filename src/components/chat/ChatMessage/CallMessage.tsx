import { Phone, PhoneMissed, PhoneOff, Video } from "lucide-react";
import type { Conversation, Message } from "../../../types";
import { MessageLayout } from "./MessageLayout";
import { getConversationDisplayAvatar, getConversationDisplayName } from "../../../utils";
import { useConversations } from "../../../contexts/ConversationsContext";

const formatCallDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds || 0)));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;

  if (minutes > 0) {
    return `${minutes} phút ${secs} giây`;
  }

  return `${secs} giây`;
};

const getRawContent = (msg: Message) => {
  const content = Array.isArray(msg.content)
    ? msg.content.filter(Boolean).join(" ")
    : msg.content;

  return String(content || "").trim();
};

const getCallDurationLabel = (msg: Message, rawText: string) => {
  const explicitLabel = rawText.split(/\s+-\s+/).slice(1).join(" - ").trim();
  if (explicitLabel) return explicitLabel;

  const meta = (msg as Message & {
    system_meta?: { durationSeconds?: number; duration_seconds?: number };
  }).system_meta;
  const durationSeconds = Number(
    meta?.durationSeconds ?? meta?.duration_seconds ?? NaN,
  );

  return Number.isFinite(durationSeconds)
    ? formatCallDuration(durationSeconds)
    : rawText;
};

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
  onRecall,
  disableRecall = false,
}: {
  msg: Message;
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  isTopBoundary?: boolean;
  onDelete?: (msg: Message) => void;
  conversation?: Conversation;
  onRecall?: (callType: "voice" | "video", msg: Message) => void;
  disableRecall?: boolean;
}) => {
  const { conversations } = useConversations();
  const rawText = getRawContent(msg);
  const normalizedType = String(msg.type || "").toLowerCase();
  if (normalizedType === "call_start" || normalizedType === "call_join") {
    return null;
  }

  const messageConversationId = String(
    msg.conversation_id || conversation?._id || "",
  );
  const liveConversation =
    conversations.find(
      (item) => String(item.conversation._id) === messageConversationId,
    )?.conversation || conversation;

  const meta = (msg as Message & {
    system_meta?: { callType?: string; call_type?: string };
  }).system_meta;
  const metaCallType = String(
    meta?.callType || meta?.call_type || "",
  ).toLowerCase();
  const isVideoCall = metaCallType
    ? metaCallType === "video"
    : /video/i.test(rawText);
  const isGroupConversation = liveConversation?.type === "group";
  const isGroupCallActive =
    isGroupConversation && Boolean(liveConversation?.is_calling);
  const isMissedCall =
    normalizedType === "call_missed" ||
    normalizedType === "call_cancel" ||
    normalizedType === "call_no_answer";
  const durationLabel = getCallDurationLabel(msg, rawText);
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
  const secondaryLabel = isGroupConversation
    ? ""
    : isMissedCall
      ? callTimeLabel
      : durationLabel || label;
  const canRecall = Boolean(onRecall || msg.conversation_id) && !isGroupCallActive;
  const isRecallDisabled = disableRecall || !canRecall;

  const handleRecall = () => {
    if (isRecallDisabled) return;

    if (onRecall) {
      onRecall(isVideoCall ? "video" : "voice", msg);
      return;
    }

    const conversationId = String(msg.conversation_id || "");
    if (!conversationId) return;

    const avatar = liveConversation && currentUserId
      ? getConversationDisplayAvatar(liveConversation, currentUserId) || ""
      : "";

    const queryParams: Record<string, string> = {
      conversationId,
      type: isVideoCall ? "video" : "voice",
      action: "start",
      name: (liveConversation && currentUserId ? getConversationDisplayName(liveConversation, currentUserId) : "") || "Cuộc gọi",
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
      participants={conversation?.participants}
      conversationType={conversation?.type}
    >
      {(borderRadius) => (
        <div
          className={`min-w-56 max-w-[320px] p-3 text-[13px] shadow-sm  transition-all ${isMe
              ? "bg-[var(--color-chat-me)] text-[var(--color-chat-me-text)]"
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
              {secondaryLabel && (
                <div className="mt-1 text-[12px] opacity-70 font-medium">
                  {secondaryLabel}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRecall}
            disabled={isRecallDisabled}
            className={`mt-3 w-full rounded-lg py-2 text-[15px] font-semibold transition-all ${
              isRecallDisabled
                ? "cursor-not-allowed bg-slate-100 text-slate-400"
                : isMe
                ? "bg-[var(--color-primary-400)] text-white hover:bg-[var(--color-primary-500)]"
                : "bg-[var(--color-primary-100)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-200)]"
              }`}
            title={
              disableRecall || isGroupCallActive
                ? "Đang có cuộc gọi nhóm"
                : "Gọi lại"
            }
          >
            Gọi lại
          </button>
        </div>
      )}
    </MessageLayout>
  );
};
