import { useMemo, useRef, useState, type MouseEvent } from "react";
import { Pause, Play, Music } from "lucide-react";
import type { Message } from "../../../types";
import { MessageLayout } from "./MessageLayout";
import { formatFileSize, getFileNameFromUrl } from "../../../utils";

export const AudioMessage = ({
  msg,
  url,
  fileName,
  size,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  onReply,
  onReact,
}: {
  msg: Message;
  url: string;
  fileName?: string;
  size?: number;
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, reactionType: string) => void;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const rawFileName = fileName || getFileNameFromUrl(url, "audio");
  const finalFileName = decodeURIComponent(rawFileName);
  const sizeLabel = size ? formatFileSize(size) : "";

  // Tạo waveform cố định (30 thanh với độ cao ngẫu nhiên từ 4px đến 20px)
  const waveformBars = useMemo(
    () => Array.from({ length: 30 }, () => Math.floor(Math.random() * 16) + 4),
    [],
  );

  const progress = duration > 0 ? currentTime / duration : 0;

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${String(sec).padStart(2, "0")}`;
  };

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      await audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (event: MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const container = progressRef.current;
    if (!audio || !container || !duration) return;

    const rect = container.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    audio.currentTime = ratio * duration;
  };

  return (
    <MessageLayout
      msg={msg}
      isMe={isMe}
      currentUserId={currentUserId}
      isFirst={isFirstInSequence}
      isLast={isLastInSequence}
      onReply={onReply}
      onReact={onReact}
    >
      {(borderRadius) => (
        <div
          className={`
    group flex flex-col gap-2 p-3 border transition-all min-w-[260px] max-w-xs shadow-sm
    ${borderRadius}
    ${
      isMe
        ? "bg-chat-me border-chat-me hover:brightness-95 text-chat-me-text"
        : "bg-chat-other border-chat-other-border hover:bg-gray-50 text-chat-other-text"
    }
  `}
        >
          <audio
            ref={audioRef}
            src={url}
            onLoadedMetadata={() =>
              setDuration(audioRef.current?.duration || 0)
            }
            onTimeUpdate={() =>
              setCurrentTime(audioRef.current?.currentTime || 0)
            }
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
          />

          {/* Header: Icon & File Info */}
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-full ${isMe ? "bg-primary-300/30" : "bg-primary-100"}`}
            >
              <Music size={14} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate leading-none mb-1">
                {finalFileName}
              </p>
              <p
                className={`text-[9px] font-medium uppercase tracking-wider opacity-60`}
              >
                {sizeLabel || "Audio File"}
              </p>
            </div>
          </div>

          {/* Player: Play Button & Waveform */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95
                ${isMe ? "bg-primary-600 text-white  hover:bg-primary-700" : "bg-primary-500 text-white hover:bg-primary-600"}
              `}
            >
              {isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <div
              ref={progressRef}
              onClick={handleSeek}
              className="relative flex-1 h-10 flex items-center gap-[3px] cursor-pointer"
            >
              {waveformBars.map((height, i) => {
                const barProgress = i / waveformBars.length;
                const isActive = barProgress <= progress;
                return (
                  <div
                    key={i}
                    style={{ height: `${height}px` }}
                    className={`
                      w-[3px] rounded-full transition-colors duration-300
                      ${
                        isActive
                          ? "bg-primary-600"
                          : isMe
                            ? "bg-primary-300"
                            : "bg-primary-200"
                      }
                    `}
                  />
                );
              })}
            </div>
          </div>

          {/* Footer: Time Indicator */}
          <div
            className={`flex justify-between items-center px-1 border-t pt-1.5 ${isMe ? "border-primary-300/30" : "border-gray-100"}`}
          >
            <span className="text-[10px] font-bold tabular-nums text-primary-700">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] font-bold tabular-nums opacity-50">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      )}
    </MessageLayout>
  );
};
