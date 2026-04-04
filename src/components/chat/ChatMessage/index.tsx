import { memo, useMemo } from "react";
import { getFullUrl } from "../../../utils";
import { TextMessage } from "./TextMessage";
import { ImageMessage } from "./ImageMessage";
import { VideoMessage } from "./VideoMessage";
import { FileMessage } from "./FileMessage";
import { AudioMessage } from "./AudioMessage";
import { LinkMessage } from "./LinkMessage";

export const ChatMessage = memo(
  ({
    msg,
    isMe,
    currentUserId,
    isFirstInSequence,
    isLastInSequence,
    onMediaClick,
    onReply,
    onReact,
  }: {
    msg: any;
    isMe: boolean;
    currentUserId?: string;
    isFirstInSequence: boolean;
    isLastInSequence: boolean;
    onMediaClick?: (imageIndex: number) => void;
    onReply?: (msg: any) => void;
    onReact?: (msg: any, reactionType: string) => void;
  }) => {
    const msgType = msg.type?.toLowerCase();

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
            onClick={onMediaClick}
            onReply={onReply}
            onReact={onReact}
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
            onClick={() => onMediaClick?.(0)}
            onReply={onReply}
            onReact={onReact}
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
            onReply={onReply}
            onReact={onReact}
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
            onReply={onReply}
            onReact={onReact}
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
            onReply={onReply}
            onReact={onReact}
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
            onReply={onReply}
            onReact={onReact}
          />
        );
    }
  },
  (prev, next) => {
    const prevReactions = JSON.stringify(prev.msg.reactions || []);
    const nextReactions = JSON.stringify(next.msg.reactions || []);

    return (
      prev.msg._id === next.msg._id &&
      prev.msg.content === next.msg.content &&
      prevReactions === nextReactions &&
      prev.msg.reply_to_msg_id === next.msg.reply_to_msg_id &&
      prev.msg.reply_to?.content === next.msg.reply_to?.content &&
      prev.isFirstInSequence === next.isFirstInSequence &&
      prev.isLastInSequence === next.isLastInSequence
    );
  },
);
