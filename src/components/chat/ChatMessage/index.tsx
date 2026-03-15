import { memo, useMemo } from "react";
import { getFullUrl } from "../../../utils";
import { TextMessage } from "./TextMessage";
import { ImageMessage } from "./ImageMessage";
import { VideoMessage } from "./VideoMessage";
import { FileMessage } from "./FileMessage";

export const ChatMessage = memo(
  ({
    msg,
    isMe,
    isFirstInSequence,
    isLastInSequence,
    onMediaClick,
  }: {
    msg: any;
    isMe: boolean;
    isFirstInSequence: boolean;
    isLastInSequence: boolean;
    onMediaClick?: (imageIndex: number) => void;
  }) => {
    const msgType = msg.type?.toLowerCase();

    // Cho video/file: chỉ lấy phần tử đầu tiên
    const fullUrl = useMemo(() => {
      if (msgType === "text" || msgType === "image") return "";
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
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            onClick={onMediaClick}
          />
        );

      case "video":
        return (
          <VideoMessage
            msg={msg}
            url={fullUrl}
            isMe={isMe}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            onClick={() => onMediaClick?.(0)}
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
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
          />
        );

      case "text":
      default:
        return (
          <TextMessage
            msg={msg}
            isMe={isMe}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
          />
        );
    }
  },
  (prev, next) => {
    return (
      prev.msg._id === next.msg._id &&
      prev.msg.content === next.msg.content &&
      prev.isFirstInSequence === next.isFirstInSequence &&
      prev.isLastInSequence === next.isLastInSequence
    );
  },
);
