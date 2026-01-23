import { useRef, useState, useEffect } from "react";
import { Play } from "lucide-react";
import { UserService } from "../../../services";
import type { Message, User as UserType } from "../../../types";

// --- Helper Functions ---
const getAvatarColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const getAvatarLabel = (str: string) => {
  return str ? str.charAt(0).toUpperCase() : "?";
};

// --- Component VideoMessage ---
export const VideoMessage = ({
  msg,
  url,
  isMe,
  isFirstInSequence,
  isLastInSequence,
}: {
  msg: Message;
  url: string;
  isMe: boolean;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
}) => {
  // 1. Logic Video Player
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  // 2. Logic Lấy User Info
  const [sender, setSender] = useState<UserType | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (isMe || !msg?.sender_id) return; // Thêm check msg? để tránh crash
      try {
        const userData = await UserService.getUserById(String(msg.sender_id));
        setSender(userData);
      } catch (error) {
        console.error("Lỗi lấy user:", error);
      }
    };
    fetchUser();
  }, [msg?.sender_id, isMe]);

  const senderName = sender?.name || "Người lạ";
  const senderAvatarUrl = sender?.avatar;
  const avatarBg = getAvatarColor(senderName);
  const avatarLabel = getAvatarLabel(senderName);

  // 3. 🔥 LOGIC BO GÓC (Border Radius) - Đồng bộ với TextMessage
  const borderRadius = isMe
    ? // --- CỦA MÌNH (Bên Phải) ---
      isFirstInSequence && isLastInSequence
      ? "rounded-[18px]" // Tin đơn: Tròn đều
      : isFirstInSequence
        ? "rounded-[18px] rounded-br-[2px]" // Đầu: Nhọn dưới-phải
        : isLastInSequence
          ? "rounded-[18px] rounded-tr-[2px]" // Cuối: Nhọn trên-phải
          : "rounded-[18px] rounded-r-[2px]" // Giữa: Phẳng phải
    : // --- CỦA HỌ (Bên Trái) ---
      isFirstInSequence && isLastInSequence
      ? "rounded-[18px]" // Tin đơn: Tròn đều
      : isFirstInSequence
        ? "rounded-[18px] rounded-bl-[2px]" // Đầu: Nhọn dưới-trái
        : isLastInSequence
          ? "rounded-[18px] rounded-tl-[2px]" // Cuối: Nhọn trên-trái
          : "rounded-[18px] rounded-l-[2px]"; // Giữa: Phẳng trái

  return (
    <div
      className={`flex w-full ${isLastInSequence ? "mb-4" : "mb-[2px]"} 
      ${isMe ? "justify-end" : "justify-start gap-2.5"}`}
    >
      {/* === CỘT AVATAR (Bên Trái) === */}
      {!isMe && (
        <div className="flex-shrink-0 flex flex-col w-8">
          {/* Avatar chỉ hiện ở tin ĐẦU TIÊN của chuỗi */}
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
            <div className="w-8" />
          )}
        </div>
      )}

      {/* === CỘT VIDEO (Bên Phải) === */}
      <div
        className={`flex flex-col max-w-[70%] ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        {/* Tên người gửi */}
        {!isMe && isFirstInSequence && (
          <span className="text-[12px] font-semibold text-gray-600 mb-1 ml-1 select-none">
            {senderName}
          </span>
        )}

        {/* Khung Video Player */}
        <div
          className={`relative max-w-[300px] overflow-hidden bg-black shadow-sm group cursor-pointer border border-gray-100
          ${borderRadius}
          `}
          onClick={handleTogglePlay}
        >
          <video
            ref={videoRef}
            src={url}
            className="w-full h-full object-cover max-h-[400px]"
            controls={isPlaying}
            preload="metadata"
            onPlay={onPlay}
            onPause={onPause}
          />

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transform group-hover:scale-110 transition-transform">
                <Play
                  className="w-5 h-5 text-gray-900 ml-1"
                  fill="currentColor"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
