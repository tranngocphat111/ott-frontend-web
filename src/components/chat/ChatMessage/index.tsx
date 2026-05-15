import { memo, useMemo } from "react";
import { getFullUrl } from "../../../utils";
import { TextMessage } from "./TextMessage";
import { ImageMessage } from "./ImageMessage";
import { VideoMessage } from "./VideoMessage";
import { FileMessage } from "./FileMessage";
import { AudioMessage } from "./AudioMessage";
import { LinkMessage } from "./LinkMessage";
import { RevokedMessage } from "./RevokedMessage";
import { CallMessage } from "./CallMessage";
import { PollMessage } from "./PollMessage";
import type { Conversation, ConversationParticipant, Message } from "../../../types";

type RenderableMessage = Message & {
  __show_delivery_status?: boolean;
};

type ChatMessageProps = {
  msg: RenderableMessage;
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  isTopBoundary?: boolean;
  onMediaClick?: (index: number) => void;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, reaction: string) => void;
  onRevoke?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onPin?: (msg: Message) => void;
  onForward?: (msg: Message) => void;
  onRecallCall?: (callType: "voice" | "video", msg: Message) => void;
  disableRecallCall?: boolean;
  conversation?: Conversation;
  translatedText?: string;
};

const stringifyParticipantCursors = (participants?: ConversationParticipant[]) =>
  JSON.stringify(
    (participants || []).map((participant) => ({
      user_id: participant?.user_id || participant?._id || "",
      membership_status: participant?.membership_status || "",
      last_delivered_message_id:
        participant?.last_delivered_message_id || "0",
      last_read_message_id: participant?.last_read_message_id || "0",
    })),
  );

export const ChatMessage = memo(
  ({
    msg,
    isMe,
    currentUserId,
    isFirstInSequence,
    isLastInSequence,
    isTopBoundary,
    onMediaClick,
    onReply,
    onReact,
    onRevoke,
    onDelete,
    onPin,
    onForward,
    onRecallCall,
    disableRecallCall,
    conversation,
    translatedText,
  }: ChatMessageProps) => {
    const msgType = msg.type?.toLowerCase();
    const isDeleted = !!msg.is_deleted;
    const isRevoked = !!msg.is_revoked;

    const fullUrl = useMemo(() => {
      if (msgType === "text" || msgType === "link" || msgType === "image") {
        return "";
      }
      const content = Array.isArray(msg.content) ? msg.content[0] : msg.content;
      return getFullUrl(content);
    }, [msg.content, msgType]);

    const imageUrls = useMemo(() => {
      if (msgType !== "image") return [];
      const content = Array.isArray(msg.content) ? msg.content : [msg.content];
      return content.map((item) => getFullUrl(item));
    }, [msg.content, msgType]);

    if (isRevoked) {
      return (
        <RevokedMessage
          msg={msg}
          isMe={isMe}
          currentUserId={currentUserId}
          isFirstInSequence={isFirstInSequence}
          isLastInSequence={isLastInSequence}
          isTopBoundary={isTopBoundary}
          onDelete={onDelete}
          participants={conversation?.participants}
          conversationType={conversation?.type}
        />
      );
    }

    if (isDeleted) {
      const placeholder = "Tin nhắn đã bị xóa";

      return (
        <TextMessage
          msg={{
            ...msg,
            type: "text",
            content: [placeholder] as unknown as Message["content"],
            reply_to: null,
            reply_to_msg_id: null,
            reactions: [],
          }}
          isMe={isMe}
          currentUserId={currentUserId}
          isFirstInSequence={isFirstInSequence}
          isLastInSequence={isLastInSequence}
          isTopBoundary={isTopBoundary}
          participants={conversation?.participants}
          conversationType={conversation?.type}
        />
      );
    }

    switch (msgType) {
      case "image":
        return (
          <ImageMessage
            msg={msg}
            urls={imageUrls}
            isMe={isMe}
            currentUserId={currentUserId}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            isTopBoundary={isTopBoundary}
            onClick={onMediaClick}
            onReply={onReply}
            onReact={onReact}
            onRevoke={onRevoke}
            onDelete={onDelete}
            onPin={onPin}
            onForward={onForward}
            participants={conversation?.participants}
            conversationType={conversation?.type}
          />
        );

      case "video":
        return (
          <VideoMessage
            msg={msg}
            url={fullUrl}
            isMe={isMe}
            currentUserId={currentUserId}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            isTopBoundary={isTopBoundary}
            onClick={() => onMediaClick?.(0)}
            onReply={onReply}
            onReact={onReact}
            onRevoke={onRevoke}
            onDelete={onDelete}
            onPin={onPin}
            onForward={onForward}
            participants={conversation?.participants}
            conversationType={conversation?.type}
          />
        );

      case "file":
        return (
          <FileMessage
            msg={msg}
            url={fullUrl}
            fileName={msg.fileName}
            size={msg.size}
            isMe={isMe}
            currentUserId={currentUserId}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            isTopBoundary={isTopBoundary}
            onReply={onReply}
            onReact={onReact}
            onRevoke={onRevoke}
            onDelete={onDelete}
            onPin={onPin}
            onForward={onForward}
            participants={conversation?.participants}
            conversationType={conversation?.type}
          />
        );

      case "audio":
        return (
          <AudioMessage
            msg={msg}
            url={fullUrl}
            fileName={msg.fileName}
            size={msg.size}
            isMe={isMe}
            currentUserId={currentUserId}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            isTopBoundary={isTopBoundary}
            onReply={onReply}
            onReact={onReact}
            onRevoke={onRevoke}
            onDelete={onDelete}
            onPin={onPin}
            onForward={onForward}
            participants={conversation?.participants}
            conversationType={conversation?.type}
          />
        );

      case "link":
        return (
          <LinkMessage
            msg={msg}
            isMe={isMe}
            currentUserId={currentUserId}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            isTopBoundary={isTopBoundary}
            onReply={onReply}
            onReact={onReact}
            onRevoke={onRevoke}
            onDelete={onDelete}
            onPin={onPin}
            onForward={onForward}
            participants={conversation?.participants}
            conversationType={conversation?.type}
          />
        );

      case "call_start":
      case "call_join":
      case "call_end":
      case "call_missed":
      case "call_cancel":
      case "call_no_answer":
        return (
          <CallMessage
            msg={msg}
            isMe={isMe}
            currentUserId={currentUserId}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            isTopBoundary={isTopBoundary}
            onDelete={onDelete}
            conversation={conversation}
            onRecall={onRecallCall}
            disableRecall={disableRecallCall}
          />
        );

      case "poll":
        return (
          <PollMessage
            msg={msg}
            isMe={isMe}
            currentUserId={currentUserId}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            isTopBoundary={isTopBoundary}
            onReply={onReply}
            onReact={onReact}
            onRevoke={onRevoke}
            onDelete={onDelete}
            onPin={onPin}
            onForward={onForward}
            participants={conversation?.participants}
            conversationType={conversation?.type}
          />
        );

      case "text":
      default:
        return (
          <TextMessage
            msg={msg}
            isMe={isMe}
            currentUserId={currentUserId}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            isTopBoundary={isTopBoundary}
            onReply={onReply}
            onReact={onReact}
            onRevoke={onRevoke}
            onDelete={onDelete}
            onPin={onPin}
            onForward={onForward}
            participants={conversation?.participants}
            translatedText={translatedText}
            conversationType={conversation?.type}
          />
        );
    }
  },
  (prev, next) => {
    const prevType = String(prev.msg.type || "").toLowerCase();
    const nextType = String(next.msg.type || "").toLowerCase();
    const isCallMessage =
      prevType.startsWith("call_") || nextType.startsWith("call_");
    if (isCallMessage) {
      return false;
    }

    const prevReactions = JSON.stringify(prev.msg.reactions || []);
    const nextReactions = JSON.stringify(next.msg.reactions || []);
    const prevReplyTo = JSON.stringify(prev.msg.reply_to || null);
    const nextReplyTo = JSON.stringify(next.msg.reply_to || null);
    const prevSystemMeta = JSON.stringify(prev.msg.system_meta || null);
    const nextSystemMeta = JSON.stringify(next.msg.system_meta || null);
    const shouldCompareParticipantCursors =
      Boolean(prev.msg.__show_delivery_status) ||
      Boolean(next.msg.__show_delivery_status);
    const participantCursorsEqual =
      !shouldCompareParticipantCursors ||
      stringifyParticipantCursors(prev.conversation?.participants) ===
        stringifyParticipantCursors(next.conversation?.participants);
    const conversationTypeEqual =
      !shouldCompareParticipantCursors ||
      prev.conversation?.type === next.conversation?.type;

    return (
      prev.msg._id === next.msg._id &&
      prev.msg.local_client_id === next.msg.local_client_id &&
      prev.msg.local_status === next.msg.local_status &&
      prev.msg.local_error === next.msg.local_error &&
      prev.msg.local_upload_progress === next.msg.local_upload_progress &&
      JSON.stringify(prev.msg.local_preview_urls || []) ===
        JSON.stringify(next.msg.local_preview_urls || []) &&
      prev.msg.type === next.msg.type &&
      prev.msg.content === next.msg.content &&
      prevReactions === nextReactions &&
      prev.msg.is_deleted === next.msg.is_deleted &&
      prev.msg.is_revoked === next.msg.is_revoked &&
      prev.msg.is_pinned === next.msg.is_pinned &&
      prevSystemMeta === nextSystemMeta &&
      prev.msg.reply_to_msg_id === next.msg.reply_to_msg_id &&
      prevReplyTo === nextReplyTo &&
      prev.translatedText === next.translatedText &&
      prev.isFirstInSequence === next.isFirstInSequence &&
      prev.isLastInSequence === next.isLastInSequence &&
      participantCursorsEqual &&
      conversationTypeEqual
    );
  },
);
