import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Music,
  Pause,
  Play,
  RotateCcw,
  X,
  Download,
} from "lucide-react";
import type { Message } from "../../../types";
import { API_CHAT_SERVER_URL } from "../../../config/api.config";
import { MessageLayout } from "./MessageLayout";
import { formatFileSize, getFileNameFromUrl, getFullUrl } from "../../../utils";
import {
  registerAudioPlaybackHandler,
  resetOtherAudioPlaybacks,
} from "../../../utils/audioPlaybackManagerUtils";

export const AudioMessage = ({
  msg,
  url,
  fileName,
  size,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  isTopBoundary,
  onReply,
  onReact,
  onRevoke,
  onDelete,
  onPin,
  onForward,
  participants,
  conversationType,
}: {
  msg: Message;
  url: string;
  fileName?: string;
  size?: number;
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  isTopBoundary?: boolean;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, reactionType: string) => void;
  onRevoke?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onPin?: (msg: Message) => void;
  onForward?: (msg: Message) => void;
  participants?: any[];
  conversationType?: string;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const rawFileName =
    fileName || msg.fileName || getFileNameFromUrl(url, "audio");
  const finalFileName = decodeURIComponent(rawFileName);
  const sizeLabel = size ? formatFileSize(size) : "";
  const isUploading = msg.local_status === "uploading";
  const isUploadSuccess = msg.local_status === "success";
  const isUploadError = msg.local_status === "error";
  const hasUploadState = isUploading || isUploadSuccess || isUploadError;

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

    setIsLoading(true);

    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    try {
      await resetOtherAudioPlaybacks(String(msg.msg_id || msg._id || ""));
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
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

  const handleDownload = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();

    try {
      const normalizedUrl = getFullUrl(url);
      const fileName = finalFileName || `voice-${Date.now()}.mp3`;
      const downloadUrl = `${API_CHAT_SERVER_URL}/media/download?fileUrl=${encodeURIComponent(normalizedUrl)}&fileName=${encodeURIComponent(fileName)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      const link = document.createElement("a");
      link.href = url;
      link.download = finalFileName;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  useEffect(() => {
    const audioId = String(msg.msg_id || msg._id || "");
    if (!audioId) return undefined;

    return registerAudioPlaybackHandler(audioId, () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(false);
    });
  }, [msg._id, msg.msg_id]);

  return (
    <MessageLayout
      msg={msg}
      isMe={isMe}
      currentUserId={currentUserId}
      isFirst={isFirstInSequence}
      isLast={isLastInSequence}
      isTopBoundary={isTopBoundary}
      onReply={onReply}
      onReact={onReact}
      onRevoke={onRevoke}
      onDelete={onDelete}
      onPin={onPin}
      onForward={onForward}
      participants={participants}
      conversationType={conversationType}
    >
      {(borderRadius) => (
        <div className="relative inline-block">
          <div
            className={`
              group flex flex-col gap-2 p-3 border transition-all max-w-xs shadow-sm relative overflow-hidden
              ${borderRadius}
              ${
                isMe
                  ? "bg-chat-me border-chat-me hover:brightness-95 text-chat-me-text"
                  : "bg-chat-other border-chat-other-border hover:bg-gray-50 text-chat-other-text"
              }
            `}
            style={{ minWidth: "260px" }}
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
                <p className="text-[9px] font-medium uppercase tracking-wider opacity-60">
                  {sizeLabel || "Audio File"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95
                  ${isMe ? "bg-primary-600 text-white hover:bg-primary-700" : "bg-primary-300 text-white hover:bg-primary-400"}
                `}
                disabled={hasUploadState || isLoading}
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <div
                ref={progressRef}
                onClick={hasUploadState ? undefined : handleSeek}
                className={`relative flex-1 h-10 flex items-center ${hasUploadState ? "opacity-70 pointer-events-none" : "cursor-pointer"}`}
                style={{ gap: "3px" }}
              >
                {waveformBars.map((height, i) => {
                  const barProgress = i / waveformBars.length;
                  const isActive = progress > 0 && barProgress <= progress;

                  return (
                    <div
                      key={i}
                      style={{ height: `${height}px`, width: "3px" }}
                      className={`rounded-full transition-colors duration-300 ${isActive ? "bg-primary-600" : isMe ? "bg-primary-300" : "bg-primary-200"}`}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                  isMe
                    ? "bg-primary-200/60 text-primary-700 hover:bg-primary-200"
                    : "bg-primary-50 text-slate-600 hover:bg-primary-100"
                }`}
                title="Tải xuống"
                disabled={hasUploadState}
              >
                <Download size={16} />
              </button>
            </div>

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

            {hasUploadState && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                {/* ... existing upload states ... */}
                {isUploadError ? (
                  <div className="flex flex-col items-center gap-2 text-white px-3 text-center">
                    <AlertCircle size={18} />
                    <div className="text-xs font-semibold">Gửi thất bại</div>
                    {typeof msg.local_retry === "function" && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void msg.local_retry?.();
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-900"
                      >
                        <RotateCcw size={12} />
                        Gửi lại
                      </button>
                    )}
                  </div>
                ) : isUploadSuccess ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">
                    <CheckCircle2 size={14} />
                    Đã gửi
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/70 px-3 py-2 text-xs font-semibold text-white">
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" />
                      Đang gửi
                    </span>
                    {typeof msg.local_cancel === "function" && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          msg.local_cancel?.();
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-900"
                      >
                        <X size={12} />
                        Hủy
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </MessageLayout>
  );
};
