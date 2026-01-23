import { useState, useEffect } from "react";
import type { Message, User as UserType } from "../../../types";
import { convertShortcodeToEmoji } from "../../../utils";
import { UserService } from "../../../services";

// --- Helper: Tạo màu nền Avatar từ tên ---
const getAvatarColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

// --- Helper: Lấy chữ cái đầu ---
const getAvatarLabel = (str: string) => {
  return str ? str.charAt(0).toUpperCase() : "?";
};

export const TextMessage = ({
  msg,
  isMe,
  isFirstInSequence,
  isLastInSequence,
}: {
  msg: Message;
  isMe: boolean;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
}) => {
  // 1. Xử lý nội dung tin nhắn (chống lỗi nếu content là mảng)
  const text = Array.isArray(msg.content)
    ? msg.content.join("")
    : String(msg.content || "");

  // 2. State lưu thông tin người gửi
  const [sender, setSender] = useState<UserType | null>(null);

  // 3. Fetch thông tin người gửi (Chỉ fetch nếu không phải là mình)
  useEffect(() => {
    const fetchUser = async () => {
      // Nếu là mình hoặc không có sender_id thì không cần gọi API
      if (isMe || !msg.sender_id) return;

      try {
        const userData = await UserService.getUserById(String(msg.sender_id));
        setSender(userData);
      } catch (error) {
        console.error("Lỗi lấy user:", error);
      }
    };
    fetchUser();
  }, [msg.sender_id, isMe]);

  // 4. Chuẩn bị dữ liệu hiển thị (Fallback nếu chưa load xong)
  const senderName = sender?.name || "Người lạ";
  const senderAvatarUrl = sender?.avatar;
  const avatarBg = getAvatarColor(senderName);
  const avatarLabel = getAvatarLabel(senderName);

  // 5. 🔥 LOGIC BO GÓC (Border Radius) - Tạo hiệu ứng dính liền
  // Sử dụng 'rounded-none' ở các góc tiếp xúc để tạo cảm giác liền mạch
  const borderRadius = isMe
    ? // --- TIN CỦA MÌNH (Bên Phải) ---
      isFirstInSequence && isLastInSequence
      ? "rounded-[18px]" // Tin đơn: Tròn đều
      : isFirstInSequence
        ? "rounded-[18px] rounded-br-[2px]" // Đầu chuỗi: Góc dưới phải nhọn
        : isLastInSequence
          ? "rounded-[18px] rounded-tr-[2px]" // Cuối chuỗi: Góc trên phải nhọn
          : "rounded-[18px] rounded-r-[2px]" // Giữa chuỗi: Cạnh phải thẳng
    : // --- TIN NGƯỜI KHÁC (Bên Trái) ---
      isFirstInSequence && isLastInSequence
      ? "rounded-[18px]" // Tin đơn: Tròn đều
      : isFirstInSequence
        ? "rounded-[18px] rounded-bl-[2px]" // Đầu chuỗi: Góc dưới trái nhọn
        : isLastInSequence
          ? "rounded-[18px] rounded-tl-[2px]" // Cuối chuỗi: Góc trên trái nhọn
          : "rounded-[18px] rounded-l-[2px]"; // Giữa chuỗi: Cạnh trái thẳng

  return (
    <div
      // Logic Margin: Hết chuỗi thì cách xa (mb-4), đang nhắn tiếp thì dính gần (mb-[2px])
      className={`flex w-full ${isLastInSequence ? "mb-4" : "mb-[2px]"} 
      ${isMe ? "justify-end" : "justify-start gap-2.5"}`}
    >
      {/* === PHẦN AVATAR (Bên Trái) === */}
      {!isMe && (
        <div className="flex-shrink-0 flex flex-col w-8">
          {/* Chỉ hiện Avatar ở tin ĐẦU TIÊN của chuỗi */}
          {isFirstInSequence ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm select-none border border-white overflow-hidden mt-1"
              style={{
                backgroundColor: senderAvatarUrl ? "transparent" : avatarBg,
              }}
            >
              {senderAvatarUrl ? (
                <img
                  src={senderAvatarUrl}
                  alt={senderName}
                  className="w-full h-full object-cover"
                />
              ) : (
                avatarLabel
              )}
            </div>
          ) : (
            // Quan trọng: Div rỗng để giữ lề cho các tin nhắn sau thẳng hàng
            <div className="w-8" />
          )}
        </div>
      )}

      {/* === PHẦN NỘI DUNG (Bên Phải) === */}
      <div
        className={`flex flex-col max-w-[70%] ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        {/* Tên người gửi: Chỉ hiện ở tin ĐẦU TIÊN */}
        {!isMe && isFirstInSequence && (
          <span className="text-[12px] font-semibold text-gray-600 mb-1 ml-1 select-none">
            {senderName}
          </span>
        )}

        {/* Bong bóng Chat */}
        <div
          className={`px-3 py-2 text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap transition-all border
          ${
            isMe
              ? "bg-[#EFDCCB] text-gray-900 border-[#EFDCCB]" // Màu tin mình
              : "bg-white text-gray-900 border-gray-200" // Màu tin người khác
          }
          ${borderRadius}
          `}
        >
          {convertShortcodeToEmoji(text)}
        </div>
      </div>
    </div>
  );
};
