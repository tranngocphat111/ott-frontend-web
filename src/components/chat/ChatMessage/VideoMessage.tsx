import { useRef, useState } from "react";
import { Play, Maximize2 } from "lucide-react"; // Import thêm icon Maximize
import type { Message } from "../../../types";
import { MessageLayout } from "./MessageLayout";

export const VideoMessage = ({
  msg,
  url,
  isMe,
  isFirstInSequence,
  isLastInSequence,
  onClick, // 1. Nhận prop onClick
}: {
  msg: Message;
  url: string;
  isMe: boolean;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  onClick?: () => void; // 2. Định nghĩa type
}) => {
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

  return (
    <MessageLayout
      msg={msg}
      isMe={isMe}
      isFirst={isFirstInSequence}
      isLast={isLastInSequence}
    >
      {(borderRadius) => (
        <div
          className={`relative max-w-[300px] overflow-hidden bg-black shadow-sm group cursor-pointer border border-gray-100 transition-all
          ${borderRadius} 
          `}
          // Click vào vùng bao quanh vẫn toggle Play/Pause (trải nghiệm tự nhiên)
          onClick={handleTogglePlay}
        >
          <video
            ref={videoRef}
            src={url}
            className="w-full h-full object-cover max-h-[400px]"
            controls={isPlaying} // Chỉ hiện controls native khi đang play
            preload="metadata"
            onPlay={onPlay}
            onPause={onPause}
          />

          {/* Overlay nút Play khi đang Pause */}
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

          {/* 3. Nút mở toàn màn hình (Chỉ hiện khi có handler onClick) */}
          {onClick && (
            <button
              className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
              onClick={(e) => {
                e.stopPropagation(); // Ngăn không cho kích hoạt Play/Pause của div cha
                onClick(); // Gọi hàm mở MediaViewer
              }}
              title="Xem toàn màn hình"
            >
              <Maximize2 size={16} />
            </button>
          )}
        </div>
      )}
    </MessageLayout>
  );
};
