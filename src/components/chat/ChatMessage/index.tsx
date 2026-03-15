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
    onMediaClick, // 1. Nhận prop từ ChatArea
  }: {
    msg: any;
    isMe: boolean;
    isFirstInSequence: boolean;
    isLastInSequence: boolean;
    onMediaClick?: () => void;
  }) => {
    // 2. 🔥 FIX QUAN TRỌNG: Chuẩn hóa type về chữ thường
    const msgType = msg.type?.toLowerCase();

    // Logic lấy URL an toàn
    const fullUrl = useMemo(() => {
      if (msgType === "text") return "";
      const content = Array.isArray(msg.content) ? msg.content[0] : msg.content;
      return getFullUrl(content);
    }, [msg.content, msgType]);

    switch (msgType) {
      case "image":
        return (
          <ImageMessage
            msg={msg}
            url={fullUrl}
            isMe={isMe}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
            onClick={onMediaClick} // 3. Truyền xuống ImageMessage
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
            onClick={onMediaClick} // 4. Truyền xuống VideoMessage
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
  // 5. 🔥 TỐI ƯU MEMO
  (prev, next) => {
    // Chỉ render lại nếu nội dung tin nhắn thay đổi hoặc vị trí (đầu/cuối) thay đổi.
    // KHÔNG so sánh onMediaClick vì nó luôn thay đổi mỗi lần cha render.
    return (
      prev.msg._id === next.msg._id &&
      prev.msg.content === next.msg.content &&
      prev.isFirstInSequence === next.isFirstInSequence &&
      prev.isLastInSequence === next.isLastInSequence
    );
  },
);
