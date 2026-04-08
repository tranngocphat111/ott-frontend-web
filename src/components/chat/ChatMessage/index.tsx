import { memo, useMemo } from "react";
import { getFullUrl } from "../../../utils";
import { TextMessage } from "./TextMessage";
import { ImageMessage } from "./ImageMessage";
import { VideoMessage } from "./VideoMessage";
import { FileMessage } from "./FileMessage";
import { AudioMessage } from "./AudioMessage";
import { LinkMessage } from "./LinkMessage";
import { RevokedMessage } from "./RevokedMessage";

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
  }: {
    msg: any;
    isMe: boolean;
    currentUserId?: string;
    isFirstInSequence: boolean;
    isLastInSequence: boolean;
    isTopBoundary?: boolean;
    onMediaClick?: (imageIndex: number) => void;
    onReply?: (msg: any) => void;
    onReact?: (msg: any, reactionType: string) => void;
    onRevoke?: (msg: any) => void;
    onDelete?: (msg: any) => void;
    onPin?: (msg: any) => void;
  }) => {
    const msgType = msg.type?.toLowerCase();
    const isDeleted = !!msg.is_deleted;
    const isRevoked = !!msg.is_revoked;

    if (isRevoked) {
      return (
        <RevokedMessage
          msg={msg}
          isMe={isMe}
          currentUserId={currentUserId}
          isFirstInSequence={isFirstInSequence}
          isLastInSequence={isLastInSequence}
          isTopBoundary={isTopBoundary}
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
            content: [placeholder],
            reply_to: null,
            reply_to_msg_id: null,
            reactions: [],
          }}
          isMe={isMe}
          currentUserId={currentUserId}
          isFirstInSequence={isFirstInSequence}
          isLastInSequence={isLastInSequence}
          isTopBoundary={isTopBoundary}
        />
      );
    }

    // Cho video/file/audio: chỉ lấy phần tử đầu tiên
    const fullUrl = useMemo(() => {
      if (msgType === "text" || msgType === "link" || msgType === "image") {
        return "";
      }
      const content = Array.isArray(msg.content) ? msg.content[0] : msg.content;
      return getFullUrl(content);
    }, [msg.content, msgType]);

    // Cho ảnh: lấy toàn bộ mảng URL
    const imageUrls = useMemo(() => {
      if (msgType !== "image") return [];
      const content = Array.isArray(msg.content) ? msg.content : [msg.content];
      return content.map((c: string) => getFullUrl(c));
    }, [msg.content, msgType]);

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
          />
        );
    }
  },
  (prev, next) => {
    const prevReactions = JSON.stringify(prev.msg.reactions || []);
    const nextReactions = JSON.stringify(next.msg.reactions || []);
    const prevReplyTo = JSON.stringify(prev.msg.reply_to || null);
    const nextReplyTo = JSON.stringify(next.msg.reply_to || null);

    return (
      prev.msg._id === next.msg._id &&
      prev.msg.content === next.msg.content &&
      prevReactions === nextReactions &&
      prev.msg.is_deleted === next.msg.is_deleted &&
      prev.msg.is_revoked === next.msg.is_revoked &&
      prev.msg.is_pinned === next.msg.is_pinned &&
      prev.msg.reply_to_msg_id === next.msg.reply_to_msg_id &&
      prevReplyTo === nextReplyTo &&
      prev.isFirstInSequence === next.isFirstInSequence &&
      prev.isLastInSequence === next.isLastInSequence
    );
  },
);
