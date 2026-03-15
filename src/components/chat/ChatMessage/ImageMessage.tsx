import type { Message } from "../../../types";
import { MessageLayout } from "./MessageLayout";

export const ImageMessage = ({
  msg,
  url,
  isMe,
  isFirstInSequence,
  isLastInSequence,
  onClick, // 1. Nhận prop onClick từ ChatMessage
}: {
  msg: Message;
  url: string;
  isMe: boolean;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  onClick?: () => void; // 2. Định nghĩa kiểu dữ liệu cho onClick
}) => {
  return (
    <MessageLayout
      msg={msg}
      isMe={isMe}
      isFirst={isFirstInSequence}
      isLast={isLastInSequence}
    >
      {(borderRadius) => (
        <div
          className={`
            relative overflow-hidden group cursor-pointer border border-gray-200 shadow-sm transition-all hover:brightness-90
            ${borderRadius} 
          `}
          // 3. Xử lý sự kiện click
          onClick={(e) => {
            e.stopPropagation(); // Ngăn sự kiện lan truyền lên trên
            if (onClick) {
              onClick(); // Mở MediaViewer
            } else {
              // Fallback: Nếu không có handler thì mở tab mới như cũ
              window.open(url, "_blank");
            }
          }}
        >
          <img
            src={url}
            alt="Attachment"
            className="block max-w-full h-auto object-cover max-h-[400px] min-w-[100px]"
            loading="lazy"
          />
        </div>
      )}
    </MessageLayout>
  );
};
