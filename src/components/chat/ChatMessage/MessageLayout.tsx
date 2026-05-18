import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  MoreVertical,
  SmilePlus,
  Reply,
  Share2,
  RotateCcw,
  Trash2,
  Pin,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Music,
  X,
} from "lucide-react";

import { useMessageSender } from "../../../hooks/useMessageSender";
import {
  getAvatarColor,
  getAvatarLabel,
  getMessageBorderRadius,
  getFullUrl,
  getFileNameFromUrl,
} from "../../../utils";
import {
  convertDisplayShortcodeToEmoji,
  convertEmojiImageMarkupToText,
} from "../../../constants/emoji.constants";
import { EmojiGlyph } from "../EmojiGlyph";
import MessageContextMenu from "./MessageContextMenu";

type MessageLayoutProps = {
  msg: any;
  isMe: boolean;
  isFirst: boolean;
  isLast: boolean;
  isTopBoundary?: boolean;
  currentUserId?: string;
  onReply?: (msg: any) => void;
  onReact?: (msg: any, reactionType: string) => void;
  onRevoke?: (msg: any) => void;
  onDelete?: (msg: any) => void;
  onPin?: (msg: any) => void;
  onForward?: (msg: any) => void;
  onVote?: (msg: any) => void;
  onViewDetails?: (msg: any) => void;
  isCentered?: boolean;
  hideAvatar?: boolean;
  showActionsOnHover?: boolean;
  participants?: any[];
  conversationType?: string;
  children: (
    borderRadius: string,
    renderMessageMeta: RenderMessageMeta,
  ) => React.ReactNode;
};

type MessageMetaVariant = "bubble" | "media";
type RenderMessageMeta = (variant?: MessageMetaVariant) => React.ReactNode;

type ReactionEntry = {
  type: string;
  userId: string;
  userName: string;
  userNickname: string;
  userAvatar: string;
};

type ReactionDetailRowProps = {
  entry: ReactionEntry;
  index: number;
  currentUserId?: string;
};

const ReactionDetailRow = ({
  entry,
  index,
  currentUserId,
}: ReactionDetailRowProps) => {
  const isCurrentUser =
    !!currentUserId &&
    !!entry.userId &&
    String(entry.userId) === String(currentUserId);

  const sender = useMessageSender(
    entry.userId,
    isCurrentUser,
    {
      user_id: entry.userId,
      name: entry.userName,
      avatar: entry.userAvatar,
    },
    !!entry.userId,
  );

  const normalizedUserName = String(entry.userName || "").trim();
  const explicitName =
    normalizedUserName && normalizedUserName !== String(entry.userId || "")
      ? normalizedUserName
      : "";
  const displayName =
    String(entry.userNickname || "").trim() ||
    explicitName ||
    String(sender?.name || "").trim() ||
    (entry.userId ? `User ${entry.userId}` : "Người dùng");
  const avatarUrl = String(entry.userAvatar || sender?.avatar || "").trim();

  return (
    <div
      key={`${entry.type}-${entry.userId}-${index}`}
      className="flex items-center justify-between border-b border-slate-100 px-1 py-2.5 last:border-b-0"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-200">
          {avatarUrl ? (
            <img
              src={getFullUrl(avatarUrl)}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className="truncate text-sm font-medium text-slate-800">
          {displayName}
        </span>
      </div>

      <span className="ml-3 shrink-0">
        <EmojiGlyph emoji={entry.type} size={18} />
      </span>
    </div>
  );
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const isMessageCursorAtLeast = (cursor: unknown, msgId: unknown) => {
  try {
    return BigInt(String(cursor || "0")) >= BigInt(String(msgId || "0"));
  } catch {
    return false;
  }
};

const getParticipantUserId = (participant: any) =>
  String(participant?.user_id || participant?._id || "").trim();

const getParticipantDisplayName = (participant: any) =>
  String(
    participant?.display_name ||
    participant?.nickname ||
    participant?.name ||
    participant?.user?.name ||
    participant?.user_id ||
    "Người dùng",
  ).trim();

const getParticipantAvatar = (participant: any) =>
  String(
    participant?.avatar ||
    participant?.avatar_url ||
    participant?.profile_picture ||
    participant?.user?.avatar ||
    participant?.user?.avatar_url ||
    "",
  ).trim();

const isJoinedParticipant = (participant: any) => {
  const membershipStatus = String(
    participant?.membership_status || participant?.participant_status || "",
  );
  return membershipStatus !== "invited" && membershipStatus !== "removed";
};

const getMessageDeliverySummary = ({
  msg,
  participants,
  conversationType,
  currentUserId,
}: {
  msg: any;
  participants?: any[];
  conversationType?: string;
  currentUserId?: string;
}) => {
  const currentMsgId = String(
    msg?.msg_id || msg?._id || msg?.local_client_id || "",
  ).trim();
  const currentUser = String(currentUserId || "").trim();
  const normalizedConversationType = String(
    conversationType || msg?.conversation_type || msg?.conversation?.type || "",
  ).toLowerCase();
  const isGroupConversation =
    normalizedConversationType === "group" ||
    normalizedConversationType === "nhom" ||
    (!normalizedConversationType && (participants || []).length > 2);
  const recipients = (participants || []).filter((participant) => {
    const participantUserId = getParticipantUserId(participant);
    return (
      participantUserId &&
      participantUserId !== currentUser &&
      isJoinedParticipant(participant)
    );
  });

  const recipientCount = recipients.length;
  const deliveredCount = recipients.filter((participant) =>
    isMessageCursorAtLeast(participant.last_delivered_message_id, currentMsgId),
  ).length;
  const seenCount = recipients.filter((participant) =>
    isMessageCursorAtLeast(participant.last_read_message_id, currentMsgId),
  ).length;
  const seenParticipants = recipients.filter((participant) =>
    isMessageCursorAtLeast(participant.last_read_message_id, currentMsgId),
  );
  const deliveredParticipants = recipients.filter(
    (participant) =>
      isMessageCursorAtLeast(
        participant.last_delivered_message_id,
        currentMsgId,
      ) &&
      !isMessageCursorAtLeast(participant.last_read_message_id, currentMsgId),
  );

  if (recipientCount === 0) {
    return {
      label: "Đã gửi",
      isSeen: false,
      isGroupConversation,
      seenParticipants,
      deliveredParticipants,
    };
  }

  if (!isGroupConversation && recipientCount <= 1) {
    return {
      label:
        seenCount === 1
          ? "Đã xem"
          : deliveredCount === 1
            ? "Đã nhận"
            : "Đã gửi",
      isSeen: seenCount === 1,
      isGroupConversation,
      seenParticipants,
      deliveredParticipants,
    };
  }

  if (seenCount === recipientCount) {
    return {
      label: "Tất cả đã xem",
      isSeen: true,
      isGroupConversation,
      seenParticipants,
      deliveredParticipants,
    };
  }

  if (seenCount > 0) {
    return {
      label: `Đã xem ${seenCount}/${recipientCount}`,
      isSeen: true,
      isGroupConversation,
      seenParticipants,
      deliveredParticipants,
    };
  }

  if (deliveredCount > 0) {
    return {
      label: isGroupConversation
        ? "Đã gửi"
        : "Đã nhận",
      isSeen: false,
      isGroupConversation,
      seenParticipants,
      deliveredParticipants,
    };
  }

  return {
    label: "Đã gửi",
    isSeen: false,
    isGroupConversation,
    seenParticipants,
    deliveredParticipants,
  };
};

const getMessageContentPreview = (msg: any) => {
  const rawContent = Array.isArray(msg?.content)
    ? msg.content[0]
    : msg?.content;
  const textContent =
    typeof rawContent === "string"
      ? rawContent
      : String(rawContent?.text || rawContent || "");

  switch (String(msg?.type || "").toLowerCase()) {
    case "image":
      return "[Hình ảnh]";
    case "video":
      return "[Video]";
    case "audio":
      return "[Âm thanh]";
    case "file":
      return msg?.fileName || getFileNameFromUrl(textContent, "Tệp tin");
    case "poll":
      return msg?.poll_question || "[Bình chọn]";
    default:
      return convertDisplayShortcodeToEmoji(
        convertEmojiImageMarkupToText(textContent || ""),
      );
  }
};

const getMessageTimeLabel = (msg: any) => {
  const rawTime = msg?.created_at || msg?.createdAt || msg?.timestamp;
  if (!rawTime) return "";

  const date = new Date(rawTime);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const ParticipantAvatar = ({
  participant,
  sizeClass = "h-8 w-8",
  textClass = "text-[10px]",
}: {
  participant: any;
  sizeClass?: string;
  textClass?: string;
}) => {
  const displayName = getParticipantDisplayName(participant);
  const avatarUrl = getParticipantAvatar(participant);

  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-slate-200 font-semibold leading-none text-white shadow-sm ring-1 ring-slate-200 ${textClass}`}
      style={{
        backgroundColor: avatarUrl ? undefined : getAvatarColor(displayName),
      }}
    >
      {avatarUrl ? (
        <img
          src={getFullUrl(avatarUrl)}
          alt={displayName}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        getAvatarLabel(displayName)
      )}
    </span>
  );
};

const DeliveryParticipantRow = ({ participant }: { participant: any }) => (
  <div className="flex min-w-0 items-center gap-3">
    <ParticipantAvatar
      participant={participant}
      sizeClass="h-10 w-10"
      textClass="text-xs"
    />
    <span className="truncate text-sm font-semibold text-primary-900">
      {getParticipantDisplayName(participant)}
    </span>
  </div>
);

const normalizeReactionType = (value: string) => {
  const normalized = convertDisplayShortcodeToEmoji(String(value || "").trim());
  const emojiMatch = normalized.match(
    /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/u,
  );

  if (emojiMatch?.[0]) return emojiMatch[0];
  return normalized.split(/\s+/)[0] || "";
};

export const MessageLayout = ({
  msg,
  isMe,
  isFirst,
  isLast,
  isTopBoundary = false,
  currentUserId,
  onReply,
  onReact,
  onRevoke,
  onDelete,
  onPin,
  onForward,
  onVote,
  onViewDetails,
  isCentered = false,
  hideAvatar = false,
  showActionsOnHover = true,
  participants,
  conversationType,
  children,
}: MessageLayoutProps) => {
  // --- STATE & REF CHO ACTION MENU (MoreVertical) ---
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showActionMenuUpward, setShowActionMenuUpward] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const actionDropdownRef = useRef<HTMLDivElement>(null);

  // --- STATE CHO CONTEXT MENU (Right-Click) ---
  const [contextMenuPosition, setContextMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // --- STATE & REF CHO REACTION PICKER ---
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showReactionPickerUpward, setShowReactionPickerUpward] =
    useState(true);
  const [showReactionPickerLeftward, setShowReactionPickerLeftward] =
    useState(true);
  const [showReactionDetails, setShowReactionDetails] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [showHoverTime, setShowHoverTime] = useState(false);
  const [activeReactionFilter, setActiveReactionFilter] = useState("all");
  const reactionTriggerRef = useRef<HTMLButtonElement>(null);
  const reactionDropdownRef = useRef<HTMLDivElement>(null);
  const reactionHoverTimeoutRef = useRef<number | null>(null);
  const hoverTimeTimeoutRef = useRef<number | null>(null);

  const preloadedSender = useMemo(
    () => ({
      user_id: String(msg.sender_id || ""),
      name: msg.sender_name,
      avatar: msg.sender_avatar || msg.sender_avatar_url,
    }),
    [msg.sender_id, msg.sender_name, msg.sender_avatar, msg.sender_avatar_url],
  );

  const sender = useMessageSender(msg.sender_id, isMe, preloadedSender);

  const borderRadius = getMessageBorderRadius(isMe, isFirst, isLast);
  const participantSender = useMemo(
    () =>
      (participants || []).find(
        (participant) =>
          String(participant?.user_id || participant?._id || "") ===
          String(msg.sender_id || ""),
      ),
    [msg.sender_id, participants],
  );
  const participantSenderName = String(
    participantSender?.nickname ||
      participantSender?.display_name ||
      participantSender?.name ||
      "",
  ).trim();
  const senderName =
    participantSenderName || sender?.name || msg.sender_name || "Người lạ";
  const senderAvatarUrl =
    participantSender?.avatar ||
    sender?.avatar ||
    msg.sender_avatar ||
    msg.sender_avatar_url;
  const avatarBg = getAvatarColor(senderName);
  const avatarLabel = getAvatarLabel(senderName);

  // XỬ LÝ DỮ LIỆU REPLY
  const replyTo = msg.reply_to;
  const replySenderName =
    replyTo?.sender_id &&
      currentUserId &&
      String(replyTo.sender_id) === String(currentUserId)
      ? "Bạn"
      : replyTo?.sender_name || "Tin nhắn gốc";
  const replyType = replyTo?.type;
  const normalizePreviewText = (value: unknown) =>
    convertDisplayShortcodeToEmoji(
      convertEmojiImageMarkupToText(String(value || "")),
    );
  const rawReplyContent = Array.isArray(replyTo?.content)
    ? replyTo.content[0]
    : replyTo?.content;
  const replyImageUrls =
    replyType === "image"
      ? (
        replyTo?.media_urls ||
        (rawReplyContent ? [String(rawReplyContent)] : [])
      )
        .filter(Boolean)
        .map((item: string) => String(item))
      : [];
  const replyImageCount =
    replyType === "image"
      ? Math.max(Number(replyTo?.media_count || 0), replyImageUrls.length)
      : 0;
  const replyMediaUrl =
    replyType === "image" || replyType === "video"
      ? getFullUrl(rawReplyContent)
      : "";
  const replyLinkUrl =
    replyType === "link"
      ? String(replyTo?.raw_content || rawReplyContent || "")
      : "";
  const replyFileName =
    replyTo?.file_name ||
    (replyType === "file" || replyType === "video" || replyType === "audio"
      ? getFileNameFromUrl(
        String(replyTo?.url || rawReplyContent || ""),
        "File",
      )
      : "");
  const replyPreviewContent = replyTo?.is_deleted
    ? "Tin nhắn đã bị xóa ở phía bạn"
    : replyTo?.is_revoked
      ? "Tin nhắn đã được thu hồi"
      : normalizePreviewText(rawReplyContent || "[Đính kèm]");

  const handleJumpToReplyMessage = () => {
    if (!replyTo?.msg_id || !msg.conversation_id) return;

    if (replyTo?.is_deleted || replyTo?.is_revoked) {
      window.dispatchEvent(
        new CustomEvent("chat:open-removed-reference-notice", {
          detail: {
            title: "Không thể mở tin nhắn gốc",
            message: replyTo?.is_deleted
              ? "Tin nhắn gốc đã bị gỡ ở phía bạn."
              : "Tin nhắn gốc đã được thu hồi.",
          },
        }),
      );
      return;
    }

    window.dispatchEvent(
      new CustomEvent("chat:jump", {
        detail: {
          conversationId: String(msg.conversation_id),
          messageId: String(replyTo.msg_id),
        },
      }),
    );
  };

  const reactionEntries = useMemo(() => {
    const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];

    const parsedReactions = reactions
      .map((reaction: any) => {
        const reactionType = normalizeReactionType(
          String(reaction?.type || ""),
        );
        if (!reactionType) return null;

        const rawNickname =
          reaction?.nickname ||
          reaction?.user_nickname ||
          reaction?.nick_name ||
          reaction?.participant?.nickname ||
          reaction?.user?.nickname ||
          reaction?.account?.nickname ||
          "";
        const rawName =
          reaction?.user_name ||
          reaction?.name ||
          reaction?.full_name ||
          reaction?.display_name ||
          reaction?.user?.name ||
          reaction?.user?.full_name ||
          reaction?.account?.name ||
          reaction?.account?.full_name;
        const userId = String(
          reaction?.user_id ||
          reaction?.account_id ||
          reaction?.user?.user_id ||
          reaction?.user?.id ||
          reaction?.account?.id ||
          "",
        );
        const userNickname = String(rawNickname || "").trim();
        const userName = String(rawName || userId || "Người dùng").trim();
        const rawAvatar =
          reaction?.user_avatar ||
          reaction?.avatar ||
          reaction?.avatar_url ||
          reaction?.user?.avatar ||
          reaction?.user?.avatar_url ||
          reaction?.account?.avatar ||
          reaction?.account?.avatar_url ||
          "";

        return {
          type: reactionType,
          userId: String(userId || ""),
          userName,
          userNickname,
          userAvatar: String(rawAvatar || ""),
        };
      })
      .filter(Boolean) as Array<{
        type: string;
        userId: string;
        userName: string;
        userNickname: string;
        userAvatar: string;
      }>;

    const dedupedByUser = new Map<string, (typeof parsedReactions)[number]>();
    const anonymousReactions: typeof parsedReactions = [];

    parsedReactions.forEach((entry) => {
      if (!entry.userId) {
        anonymousReactions.push(entry);
        return;
      }

      // Keep the latest seen reaction for each user to avoid stale multi-react states.
      dedupedByUser.set(entry.userId, entry);
    });

    return [...dedupedByUser.values(), ...anonymousReactions];
  }, [msg.reactions]);

  const reactionGroups = useMemo(() => {
    const reactionMap = new Map<
      string,
      { type: string; count: number; reactedByMe: boolean }
    >();

    reactionEntries.forEach((reaction) => {
      const existing = reactionMap.get(reaction.type);
      if (!existing) {
        reactionMap.set(reaction.type, {
          type: reaction.type,
          count: 1,
          reactedByMe: !!currentUserId && reaction.userId === currentUserId,
        });
        return;
      }

      existing.count += 1;
      if (currentUserId && reaction.userId === currentUserId) {
        existing.reactedByMe = true;
      }
    });

    return Array.from(reactionMap.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.type.localeCompare(b.type);
    });
  }, [reactionEntries, currentUserId]);

  const topReactionGroups = useMemo(
    () => reactionGroups.slice(0, 3),
    [reactionGroups],
  );

  const totalReactionCount = useMemo(
    () => reactionGroups.reduce((sum, item) => sum + item.count, 0),
    [reactionGroups],
  );

  const detailTabs = useMemo(
    () => [
      { key: "all", label: "Tất cả", count: reactionEntries.length },
      ...reactionGroups.map((group) => ({
        key: group.type,
        label: group.type,
        count: group.count,
      })),
    ],
    [reactionEntries.length, reactionGroups],
  );

  const filteredReactionEntries = useMemo(() => {
    if (activeReactionFilter === "all") return reactionEntries;
    return reactionEntries.filter(
      (entry) => entry.type === activeReactionFilter,
    );
  }, [reactionEntries, activeReactionFilter]);

  const myReactionTypes = useMemo(() => {
    if (!currentUserId) return [] as string[];

    const types = new Set<string>();
    reactionEntries.forEach((entry) => {
      if (String(entry.userId) === String(currentUserId) && entry.type) {
        types.add(entry.type);
      }
    });
    return Array.from(types);
  }, [reactionEntries, currentUserId]);

  const clearReactionHoverTimeout = () => {
    if (reactionHoverTimeoutRef.current) {
      window.clearTimeout(reactionHoverTimeoutRef.current);
      reactionHoverTimeoutRef.current = null;
    }
  };

  const openReactionPickerOnHover = () => {
    clearReactionHoverTimeout();
    setShowReactionPicker(true);
  };

  const closeReactionPickerOnLeave = () => {
    clearReactionHoverTimeout();
    reactionHoverTimeoutRef.current = window.setTimeout(() => {
      setShowReactionPicker(false);
      reactionHoverTimeoutRef.current = null;
    }, 120);
  };

  const handleSelectReaction = async (reaction: string) => {
    if (!onReact) return;

    const selectedType = normalizeReactionType(reaction);
    if (!selectedType) return;

    await Promise.resolve(onReact(msg, selectedType));

    setShowReactionPicker(false);
  };

  useEffect(() => {
    return () => clearReactionHoverTimeout();
  }, []);

  useEffect(() => {
    if (!showReactionDetails) return;
    if (activeReactionFilter === "all") return;

    const hasFilter = reactionGroups.some(
      (group) => group.type === activeReactionFilter,
    );
    if (!hasFilter) {
      setActiveReactionFilter("all");
    }
  }, [showReactionDetails, activeReactionFilter, reactionGroups]);

  const hasReactions = reactionGroups.length > 0;
  const isUploadInFlight =
    msg.local_status === "uploading" || msg.local_status === "error";
  const deliverySummary = useMemo(
    () =>
      getMessageDeliverySummary({
        msg,
        participants,
        conversationType,
        currentUserId,
      }),
    [conversationType, currentUserId, msg, participants],
  );
  const showDeliveryStatus =
    isMe &&
    !isCentered &&
    Boolean(msg.__show_delivery_status) &&
    Boolean(msg.msg_id || msg._id || msg.local_client_id);
  const seenAvatarParticipants = deliverySummary.seenParticipants || [];
  const deliveredParticipants = deliverySummary.deliveredParticipants || [];
  const shouldCompactSeenAvatars = seenAvatarParticipants.length >= 4;
  const visibleSeenAvatars = shouldCompactSeenAvatars
    ? seenAvatarParticipants.slice(0, 2)
    : seenAvatarParticipants.slice(0, 3);
  const hiddenSeenAvatarCount = shouldCompactSeenAvatars
    ? seenAvatarParticipants.length - visibleSeenAvatars.length
    : 0;
  const shouldShowInlineDeliveryStatus =
    showDeliveryStatus &&
    (!deliverySummary.isGroupConversation ||
      visibleSeenAvatars.length > 0 ||
      deliverySummary.label === "Đã gửi");
  const messageTimeLabel = getMessageTimeLabel(msg);
  const shouldShowMessageTime = Boolean(messageTimeLabel) && isLast;
  const hasSeenAvatarMeta = visibleSeenAvatars.length > 0;
  const inlineMetaLabel =
    shouldShowMessageTime || showHoverTime ? messageTimeLabel : "";
  const seenAvatarTitle =
    seenAvatarParticipants.length > 0
      ? `Đã xem: ${seenAvatarParticipants
        .map(getParticipantDisplayName)
        .join(", ")}`
      : deliverySummary.label;
  const messagePreviewText = getMessageContentPreview(msg);
  const messageCreatedLabel =
    msg.created_at || msg.createdAt
      ? new Date(msg.created_at || msg.createdAt).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      : "";
  const containerMargin = isLast
    ? hasReactions
      ? "mb-5"
      : "mb-4"
    : hasReactions
      ? "mb-4"
      : "mb-1";
  const renderMessageMeta: RenderMessageMeta = (variant = "bubble") => {
    if (!inlineMetaLabel) return null;

    if (variant === "media") {
      return (
        <span
          className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-4 text-white shadow-sm ring-1 backdrop-blur-md select-none ${isMe
              ? "bg-primary-900/40 ring-white/10"
              : "bg-black/45 ring-white/10"
            }`}
          title={inlineMetaLabel}
        >
          <Clock3 size={10} strokeWidth={2.2} />
          <span className="truncate">{inlineMetaLabel}</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex max-w-full items-center gap-1 truncate text-[10px] font-medium leading-4 select-none ${isMe ? "text-primary-700/65" : "text-slate-500/80"
          }`}
        title={inlineMetaLabel}
      >
        <span className="truncate">{inlineMetaLabel}</span>
      </span>
    );
  };

  const canDeleteForMe = !!onDelete && !isUploadInFlight;
  const canRevokeForAll =
    isMe &&
    !msg.is_deleted &&
    !msg.is_revoked &&
    !isUploadInFlight &&
    !!onRevoke;
  const canPinMessage =
    !msg.is_deleted && !msg.is_revoked && !isUploadInFlight && !!onPin;
  const canForwardMessage =
    !msg.is_deleted &&
    !msg.is_revoked &&
    !String(msg.type || "").startsWith("system_") &&
    !String(msg.type || "").startsWith("call_") &&
    !isUploadInFlight &&
    !!onForward;

  // ==========================================
  // EFFECT 1: CLICK OUTSIDE CHO ACTION MENU
  // ==========================================
  useEffect(() => {
    if (!showActionMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!actionMenuRef.current) return;
      if (!actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActionMenu]);

  // ==========================================
  // EFFECT 2: TỰ ĐỘNG ĐẢO CHIỀU CHO ACTION MENU
  // ==========================================
  useEffect(() => {
    if (!showActionMenu) return;

    const measurePlacement = () => {
      const trigger = actionButtonRef.current;
      const dropdown = actionDropdownRef.current;
      if (!trigger || !dropdown) return;

      const triggerRect = trigger.getBoundingClientRect();
      const dropdownHeight = dropdown.offsetHeight || 100;
      const isUpperHalf = triggerRect.top < window.innerHeight / 2;
      const preferredUpward = !isUpperHalf;

      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      if (
        preferredUpward &&
        spaceAbove < dropdownHeight + 12 &&
        spaceBelow > spaceAbove
      ) {
        setShowActionMenuUpward(false);
        return;
      }

      if (
        !preferredUpward &&
        spaceBelow < dropdownHeight + 12 &&
        spaceAbove > spaceBelow
      ) {
        setShowActionMenuUpward(true);
        return;
      }

      setShowActionMenuUpward(preferredUpward);
    };

    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(measurePlacement);
    });

    const handleScroll = () => window.requestAnimationFrame(measurePlacement);
    document.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", measurePlacement);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", measurePlacement);
    };
  }, [showActionMenu]);

  // ==========================================
  // EFFECT 3: CLICK OUTSIDE CHO REACTION PICKER
  // ==========================================
  useEffect(() => {
    if (!showReactionPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionDropdownRef.current &&
        !reactionDropdownRef.current.contains(event.target as Node) &&
        reactionTriggerRef.current &&
        !reactionTriggerRef.current.contains(event.target as Node)
      ) {
        setShowReactionPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showReactionPicker]);

  // ==========================================
  // EFFECT 4: TỰ ĐỘNG ĐẢO CHIỀU CHO REACTION PICKER
  // ==========================================
  useEffect(() => {
    if (!showReactionPicker) return;

    const measurePlacement = () => {
      const trigger = reactionTriggerRef.current;
      const dropdown = reactionDropdownRef.current;
      if (!trigger) return;
      const triggerRect = trigger.getBoundingClientRect();
      const isUpperHalf = triggerRect.top < window.innerHeight / 2;
      const dropdownWidth = dropdown?.offsetWidth || 290;
      const gutter = 12;

      const spaceToLeft = triggerRect.right;
      const spaceToRight = window.innerWidth - triggerRect.left;
      const preferredLeftward = triggerRect.left > window.innerWidth / 2;

      if (preferredLeftward && spaceToLeft >= dropdownWidth + gutter) {
        setShowReactionPickerLeftward(true);
      } else if (!preferredLeftward && spaceToRight >= dropdownWidth + gutter) {
        setShowReactionPickerLeftward(false);
      } else {
        setShowReactionPickerLeftward(spaceToLeft >= spaceToRight);
      }

      // Upper half => open downward, lower half => open upward.
      setShowReactionPickerUpward(!isUpperHalf);
    };

    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(measurePlacement);
    });

    const handleScroll = () => window.requestAnimationFrame(measurePlacement);
    document.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", measurePlacement);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", measurePlacement);
    };
  }, [showReactionPicker]);

  // ==========================================
  // EFFECT 5: GLOBAL CLOSE CONTEXT MENU
  // ==========================================
  useEffect(() => {
    const handleGlobalClose = () => {
      setContextMenuPosition(null);
    };
    window.addEventListener("chat:close-context-menu", handleGlobalClose);
    return () => {
      window.removeEventListener("chat:close-context-menu", handleGlobalClose);
    };
  }, []);

  const handleMessageContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      !onReply &&
      !onForward &&
      !canPinMessage &&
      !canRevokeForAll &&
      !canDeleteForMe
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    window.dispatchEvent(new Event("chat:close-context-menu"));

    setTimeout(() => {
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
    }, 0);
  };

  const clearHoverTimeTimer = () => {
    if (hoverTimeTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeTimeoutRef.current);
      hoverTimeTimeoutRef.current = null;
    }
  };

  const isPointerInMessageActionZone = (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    const target = event.target;
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('[data-message-action-zone="true"]'))
    );
  };

  const handleMessageMouseEnter = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    clearHoverTimeTimer();
    if (isPointerInMessageActionZone(event)) return;
    if (!messageTimeLabel || shouldShowMessageTime || isCentered) return;

    hoverTimeTimeoutRef.current = window.setTimeout(() => {
      setShowHoverTime(true);
      hoverTimeTimeoutRef.current = null;
    }, 650);
  };

  const handleMessageMouseLeave = () => {
    clearHoverTimeTimer();
    setShowHoverTime(false);
  };

  const handleActionZoneMouseEnter = () => {
    clearHoverTimeTimer();
    setShowHoverTime(false);
  };

  useEffect(() => {
    return () => {
      clearHoverTimeTimer();
    };
  }, []);

  return (
    <div
      className={`flex w-full ${containerMargin} ${isCentered
          ? "justify-center"
          : isMe
            ? "justify-end"
            : "justify-start gap-2.5"
        }`}
    >
      {/* CỘT AVATAR */}
      {!isMe && !hideAvatar && (
        <div className="shrink-0 flex flex-col w-8">
          {isFirst || isTopBoundary ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm border border-white overflow-hidden mt-1"
              style={{
                backgroundColor: senderAvatarUrl ? "transparent" : avatarBg,
              }}
            >
              {senderAvatarUrl ? (
                <img
                  src={getFullUrl(senderAvatarUrl)}
                  alt={senderName}
                  className="w-full h-full object-cover"
                />
              ) : (
                avatarLabel
              )}
            </div>
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* CỘT CONTENT */}
      <div
        className={`group flex flex-col ${isCentered
            ? "items-center max-w-[90%]"
            : isMe
              ? "items-end max-w-[75%] sm:max-w-[70%]"
              : "items-start max-w-[75%] sm:max-w-[70%]"
          } relative ${showActionMenu || showReactionPicker ? "z-20" : ""}`}
      >
        {!isMe && !isCentered && (isFirst || isTopBoundary) && (
          <span className="text-[12px] font-medium text-slate-500 mb-1 ml-1 select-none">
            {senderName}
          </span>
        )}

        {/* THIẾT KẾ LẠI TIN NHẮN REPLY */}
        {replyTo && (
          <div
            onClick={handleJumpToReplyMessage}
            className={`relative z-0 w-fit max-w-full rounded-t-xl rounded-b-lg px-2.5 pt-2 pb-5 -mb-3.5 cursor-pointer transition-colors border-l-[3px] flex items-center gap-2.5 ${isMe
                ? "bg-black/4 hover:bg-black/8 border-[#C1A882]"
                : "bg-black/4 hover:bg-black/8 border-slate-400"
              }`}
            title={replyTo?.msg_id ? "Đi tới tin nhắn gốc" : undefined}
          >
            {/* KHOẢNG MEDIA THUMBNAIL */}
            {!replyTo?.is_deleted &&
              !replyTo?.is_revoked &&
              replyType === "image" &&
              replyImageUrls.length > 0 && (
                <div className="relative w-9 h-9 shrink-0 rounded-sm overflow-hidden bg-black/5">
                  <img
                    src={getFullUrl(replyImageUrls[0])}
                    className="w-full h-full object-cover"
                    alt="reply"
                    loading="lazy"
                    decoding="async"
                  />
                  {replyImageCount > 1 && (
                    <div className="absolute inset-0 bg-black/45 text-white text-[10px] font-semibold leading-none flex items-center justify-center">
                      +{replyImageCount - 1}
                    </div>
                  )}
                </div>
              )}

            {!replyTo?.is_deleted &&
              !replyTo?.is_revoked &&
              replyType === "video" && (
                <div className="w-9 h-9 shrink-0 rounded-sm overflow-hidden bg-black/10 flex items-center justify-center relative">
                  {replyMediaUrl ? (
                    <video
                      src={replyMediaUrl}
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <VideoIcon size={14} className="opacity-60" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-black/40 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-white border-b-[3px] border-b-transparent ml-0.5"></div>
                    </div>
                  </div>
                </div>
              )}

            {/* KHOẢNG TEXT NỘI DUNG */}
            <div className="flex flex-col min-w-0 justify-center">
              <span
                className={`text-[11px] font-bold truncate ${isMe ? "text-[#a3845c]" : "text-slate-500"
                  }`}
              >
                {normalizePreviewText(replySenderName)}
              </span>

              <div
                className={`text-[12px] truncate mt-px leading-tight flex items-center gap-1.5 ${isMe ? "text-[#4a361c]/80" : "text-slate-700/80"
                  }`}
              >
                {replyTo?.is_deleted || replyTo?.is_revoked ? (
                  <span className="italic opacity-70">
                    {replyPreviewContent}
                  </span>
                ) : !replyTo?.is_deleted &&
                  !replyTo?.is_revoked &&
                  replyType === "image" ? (
                  <>
                    <ImageIcon size={12} className="opacity-70" />
                    <span>
                      {replyImageCount > 1
                        ? `${replyImageCount} hình ảnh`
                        : "Hình ảnh"}
                    </span>
                  </>
                ) : !replyTo?.is_deleted &&
                  !replyTo?.is_revoked &&
                  replyType === "video" ? (
                  <>
                    <VideoIcon size={12} className="opacity-70" />
                    <span className="truncate">{replyFileName || "Video"}</span>
                  </>
                ) : !replyTo?.is_deleted &&
                  !replyTo?.is_revoked &&
                  replyType === "audio" ? (
                  <>
                    <Music size={12} className="opacity-70" />
                    <span className="truncate">
                      {replyFileName || "Âm thanh"}
                    </span>
                  </>
                ) : !replyTo?.is_deleted &&
                  !replyTo?.is_revoked &&
                  replyType === "file" ? (
                  <>
                    <FileText size={12} className="opacity-70" />
                    <span className="truncate">
                      {replyFileName || "Tài liệu đính kèm"}
                    </span>
                  </>
                ) : !replyTo?.is_deleted &&
                  !replyTo?.is_revoked &&
                  replyType === "link" ? (
                  <>
                    <Reply size={12} className="opacity-70 rotate-180" />
                    <span className="truncate">
                      {replyLinkUrl || "Liên kết"}
                    </span>
                  </>
                ) : (
                  <span className="truncate block">{replyPreviewContent}</span>
                )}
              </div>
            </div>
          </div>
        )}
        <div
          className={`relative w-fit max-w-full ${hasReactions && showDeliveryStatus ? "mb-3" : ""
            }`}
          data-chat-message-bubble="true"
          onContextMenu={handleMessageContextMenu}
          onMouseEnter={handleMessageMouseEnter}
          onMouseLeave={handleMessageMouseLeave}
        >
          {/* NỘI DUNG TIN NHẮN CHÍNH */}
          {children(borderRadius, renderMessageMeta)}

          {/* THANH ICON THAO TÁC (REPLY, REACT, MORE) */}
          {showActionsOnHover &&
            (onReply ||
              onReact ||
              canDeleteForMe ||
              canRevokeForAll ||
              canPinMessage ||
              canForwardMessage) && (
              <div
                data-message-action-zone="true"
                onMouseEnter={handleActionZoneMouseEnter}
                className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-0.5 ${isMe ? "right-full mr-2" : "left-full ml-2"
                  } ${showReactionPicker || showActionMenu
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                  } ${!isMe && !isCentered ? "flex-row-reverse" : ""} transition-all duration-200`}
              >
                {(canDeleteForMe ||
                  canRevokeForAll ||
                  canPinMessage ||
                  canForwardMessage) && (
                    <div className="relative" ref={actionMenuRef}>
                      <button
                        ref={actionButtonRef}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowActionMenu((prev) => !prev);
                        }}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors z-20 ${showActionMenu
                            ? "text-slate-600 bg-slate-100"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                        title="Tùy chọn"
                      >
                        <MoreVertical size={16} strokeWidth={2} />
                      </button>

                      {showActionMenu && (
                        <div
                          ref={actionDropdownRef}
                          className={`absolute min-w-42.5 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5  ${showActionMenuUpward
                              ? "bottom-full mb-1"
                              : "top-full mt-1"
                            } ${isMe ? "right-0" : "left-0"}`}
                        >
                          {canPinMessage && onPin && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setShowActionMenu(false);
                                onPin(msg);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-slate-700 hover:bg-slate-100 transition-colors "
                            >
                              <Pin size={14} />
                              {msg.is_pinned
                                ? "Bỏ ghim tin nhắn"
                                : "Ghim tin nhắn"}
                            </button>
                          )}
                          {canForwardMessage && onForward && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setShowActionMenu(false);
                                onForward(msg);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Share2 size={14} />
                              Chuyển tiếp
                            </button>
                          )}
                          {canRevokeForAll && onRevoke && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setShowActionMenu(false);
                                onRevoke(msg);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-red-600 hover:bg-slate-100 transition-colors"
                            >
                              <RotateCcw size={14} />
                              Thu hồi tin nhắn
                            </button>
                          )}

                          {canDeleteForMe && onDelete && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setShowActionMenu(false);
                                onDelete(msg);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                              Xóa ở phía bạn
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {onReply &&
                  !msg.is_deleted &&
                  !msg.is_revoked &&
                  !isUploadInFlight && (
                    <button
                      type="button"
                      onClick={() => onReply(msg)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Trả lời"
                    >
                      <Reply size={16} strokeWidth={2} />
                    </button>
                  )}

                {onReact &&
                  !msg.is_deleted &&
                  !msg.is_revoked &&
                  !isUploadInFlight && (
                    <div
                      className="relative"
                      onMouseEnter={openReactionPickerOnHover}
                      onMouseLeave={closeReactionPickerOnLeave}
                    >
                      <button
                        ref={reactionTriggerRef}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowReactionPicker((prev) => !prev);
                        }}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${showReactionPicker
                            ? "text-slate-600 bg-slate-100"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                        title="Thả reaction"
                      >
                        <SmilePlus size={16} strokeWidth={2} />
                      </button>

                      {showReactionPicker && (
                        <div
                          ref={reactionDropdownRef}
                          className={`absolute ${showReactionPickerUpward
                              ? "bottom-[calc(100%+6px)] slide-in-from-bottom-2"
                              : "top-[calc(100%+6px)] slide-in-from-top-2"
                            } rounded-md bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl px-2 py-1.5 flex items-center gap-0.5 animate-in fade-in zoom-in-95 duration-200 ${showReactionPickerLeftward
                              ? `right-0 ${showReactionPickerUpward ? "origin-bottom-right" : "origin-top-right"}`
                              : `left-0 ${showReactionPickerUpward ? "origin-bottom-left" : "origin-top-left"}`
                            }`}
                        >
                          {QUICK_REACTIONS.map((reaction) => (
                            <button
                              key={reaction}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleSelectReaction(reaction);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100/80 hover:scale-110 transition-all duration-150"
                            >
                              <EmojiGlyph
                                emoji={normalizeReactionType(reaction)}
                                size={18}
                              />
                            </button>
                          ))}

                          {myReactionTypes.length > 0 && (
                            <>
                              <div className="mx-1 h-5 w-px bg-slate-200" />
                              <button
                                type="button"
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  for (const type of myReactionTypes) {
                                    await Promise.resolve(onReact(msg, type));
                                  }
                                  setShowReactionPicker(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 transition-all duration-150"
                                title="Gỡ reaction"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}

          {/* HIỂN THỊ REACTION ĐÃ THẢ */}
          {hasReactions && (
            <div
              data-message-action-zone="true"
              onMouseEnter={handleActionZoneMouseEnter}
              className={`absolute ${msg.type === "video" || msg.type === "image"
                  ? "-bottom-0.5"
                  : "-bottom-2.5"
                } ${isMe ? "right-0" : "left-0"} z-20 flex items-center gap-0.5 rounded-full bg-white py-px shadow-sm ring-1 ring-slate-100/50 select-none`}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveReactionFilter("all");
                  setShowReactionDetails(true);
                }}
                className="flex items-center gap-0.5 rounded-full px-1 py-0.5 transition-colors hover:bg-slate-50"
                title="Xem chi tiết biểu cảm"
              >
                {topReactionGroups.map((reaction, index) => (
                  <EmojiGlyph
                    key={`${reaction.type}-${index}`}
                    emoji={reaction.type}
                    size={12}
                  />
                ))}
                {totalReactionCount > 1 && (
                  <span className="ml-0.5 text-[10px] font-semibold leading-none text-slate-600 tabular-nums">
                    {totalReactionCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Avatar đã xem vẫn nằm ngoài bubble để không làm nặng phần nội dung. */}
        {shouldShowInlineDeliveryStatus && (
          <div
            className={`flex min-h-4 max-w-full flex-col gap-0.5 ${(msg?.type === "image" || msg?.type === "video")
                ? hasReactions ? "mt-1" : "-mt-0.5"
                : hasReactions ? "mt-3" : "mt-1"
              } ${isMe ? "items-end" : "items-start"}`}
          >
            {hasSeenAvatarMeta ? (
              <button
                type="button"
                onClick={() => setShowDeliveryDetails(true)}
                className="flex max-w-full items-center justify-end -space-x-1.5 rounded-full px-0.5 transition-opacity hover:opacity-85"
                title={seenAvatarTitle}
                aria-label={seenAvatarTitle}
              >
                {hiddenSeenAvatarCount > 0 && (
                  <span className="z-10 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full border border-white bg-slate-500 px-1 text-[8px] font-bold leading-none text-white shadow-sm ring-1 ring-slate-200">
                    +{hiddenSeenAvatarCount}
                  </span>
                )}
                {visibleSeenAvatars.map((participant) => {
                  const participantUserId = getParticipantUserId(participant);
                  const displayName = getParticipantDisplayName(participant);

                  return (
                    <ParticipantAvatar
                      key={participantUserId || displayName}
                      participant={participant}
                      sizeClass="h-4 w-4"
                      textClass="text-[8px]"
                    />
                  );
                })}
              </button>
            ) : (
              <span className="text-[11px] font-medium text-slate-500 truncate max-w-full">
                {deliverySummary.label}
              </span>
            )}
          </div>
        )}
      </div>

      {showReactionDetails && (
        <div
          className="fixed inset-0 z-120 flex items-center justify-center bg-black/35 px-4"
          onClick={() => setShowReactionDetails(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h3 className="text-4xl font-semibold">Biểu cảm</h3>
              <button
                type="button"
                onClick={() => setShowReactionDetails(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid max-h-[70vh] grid-cols-[150px_1fr]">
              <div className="border-r border-slate-200 bg-slate-50 px-2 py-2">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveReactionFilter(tab.key)}
                    className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${activeReactionFilter === tab.key
                        ? "bg-slate-200 text-slate-900"
                        : "text-slate-600 hover:bg-slate-200/80"
                      }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {tab.key === "all" ? (
                        <span>{tab.label}</span>
                      ) : (
                        <EmojiGlyph emoji={tab.label} size={16} />
                      )}
                    </span>
                    <span className="text-xs tabular-nums text-slate-500">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="min-h-70 overflow-y-auto bg-white px-4 py-2">
                {filteredReactionEntries.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Chưa có biểu cảm nào
                  </div>
                ) : (
                  filteredReactionEntries.map((entry, index) => (
                    <ReactionDetailRow
                      key={`${entry.type}-${entry.userId}-${index}`}
                      entry={entry}
                      index={index}
                      currentUserId={currentUserId}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeliveryDetails && showDeliveryStatus && (
        <div
          className="fixed inset-0 z-120 flex items-center justify-center bg-primary-900/35 px-4"
          onClick={() => setShowDeliveryDetails(false)}
        >
          <div
            className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-primary-200 bg-surface text-primary-900 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-primary-100 bg-surface-raised px-5 py-4">
              <h3 className="text-lg font-semibold text-primary-900">
                Thông tin tin nhắn
              </h3>
              <button
                type="button"
                onClick={() => setShowDeliveryDetails(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-primary-500 transition-colors hover:bg-primary-100 hover:text-primary-800"
                title="Đóng"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex justify-end border-b border-primary-100 bg-white px-5 py-5">
              <div className="max-w-[70%] rounded-lg border border-primary-200 bg-chat-me px-3 py-2 text-right shadow-sm">
                <p className="truncate text-xs text-primary-600">
                  {senderName}
                </p>
                <p className="break-words text-sm font-semibold text-chat-me-text">
                  {messagePreviewText || "[Tin nhắn]"}
                </p>
                {messageCreatedLabel && (
                  <p className="mt-1 text-xs text-primary-500">
                    {messageCreatedLabel}
                  </p>
                )}
              </div>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-surface px-5 py-4">
              <section>
                <h4 className="mb-3 text-sm font-bold text-primary-700">
                  Đã xem ({seenAvatarParticipants.length})
                </h4>
                {seenAvatarParticipants.length > 0 ? (
                  <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
                    {seenAvatarParticipants.map((participant, index) => (
                      <DeliveryParticipantRow
                        key={`seen-${getParticipantUserId(participant) || index}`}
                        participant={participant}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-primary-400">Chưa có ai xem</p>
                )}
              </section>

              <section className="mt-5">
                <h4 className="mb-3 text-sm font-bold text-primary-700">
                  Đã nhận ({deliveredParticipants.length})
                </h4>
                {deliveredParticipants.length > 0 ? (
                  <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
                    {deliveredParticipants.map((participant, index) => (
                      <DeliveryParticipantRow
                        key={`delivered-${getParticipantUserId(participant) || index}`}
                        participant={participant}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-primary-400">
                    Chưa có người nhận riêng ngoài danh sách đã xem
                  </p>
                )}
              </section>
            </div>

            <p className="border-t border-primary-100 bg-surface-raised px-5 py-3 text-xs italic text-primary-500">
              (*) Thông tin chi tiết "Đã xem", "Đã nhận" được tính theo trạng
              thái đồng bộ mới nhất của hội thoại.
            </p>
          </div>
        </div>
      )}

      <MessageContextMenu
        isOpen={contextMenuPosition !== null}
        position={contextMenuPosition || { x: 0, y: 0 }}
        onClose={() => setContextMenuPosition(null)}
        onReply={
          onReply && !msg.is_deleted && !msg.is_revoked && !isUploadInFlight
            ? () => onReply(msg)
            : undefined
        }
        onForward={
          canForwardMessage && onForward ? () => onForward(msg) : undefined
        }
        onPin={canPinMessage && onPin ? () => onPin(msg) : undefined}
        onRevoke={canRevokeForAll && onRevoke ? () => onRevoke(msg) : undefined}
        onDelete={canDeleteForMe && onDelete ? () => onDelete(msg) : undefined}
        onVote={onVote ? () => onVote(msg) : undefined}
        onViewDetails={onViewDetails ? () => onViewDetails(msg) : undefined}
        isPinned={msg.is_pinned}
      />
    </div>
  );
};
