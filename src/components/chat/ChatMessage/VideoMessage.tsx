import {
  Pause,
  Play,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  X,
  Download,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message } from "../../../types";
import { MessageLayout } from "./MessageLayout";

export const VideoMessage = ({
  msg,
  url,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  isTopBoundary,
  onClick,
  onReply,
  onReact,
  onRevoke,
  onDelete,
  onPin,
  onForward,
}: {
  msg: Message;
  url: string;
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  isTopBoundary?: boolean;
  onClick?: () => void;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, reactionType: string) => void;
  onRevoke?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onPin?: (msg: Message) => void;
  onForward?: (msg: Message) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const safeDuration = Number.isFinite(duration) ? duration : 0;
  const safeCurrentTime = Number.isFinite(currentTime) ? currentTime : 0;
  const progressValue =
    safeDuration > 0 ? (safeCurrentTime / safeDuration) * 100 : 0;
  const isUploading = msg.local_status === "uploading";
  const isUploadSuccess = msg.local_status === "success";
  const isUploadError = msg.local_status === "error";
  const hasUploadState = isUploading || isUploadSuccess || isUploadError;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setCurrentTime(video.currentTime || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(video.duration || 0);
    };

    video.volume = volume;
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [volume]);

  const handleTogglePlay = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video || hasUploadState) return;
    if (video.paused) {
      void video.play();
      return;
    }
    video.pause();
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video || safeDuration <= 0 || hasUploadState) return;
    const nextTime = (Number(event.target.value) / 100) * safeDuration;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (hasUploadState) return;
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);
    if (videoRef.current) {
      videoRef.current.volume = nextVolume;
    }
  };

  const toggleMute = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (hasUploadState) return;
    const nextVolume = volume > 0 ? 0 : 0.8;
    setVolume(nextVolume);
    if (videoRef.current) {
      videoRef.current.volume = nextVolume;
    }
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleDownload = async (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Không thể tải video");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = msg.fileName || "video.mp4";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement("a");
      link.href = url;
      link.download = msg.fileName || "video.mp4";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

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
    >
      {(borderRadius) => (
        <div className="relative inline-block">
          <div
            className={`relative max-w-75 overflow-hidden bg-black shadow-sm group cursor-pointer border border-gray-100 transition-all ${borderRadius}`}
            onClick={() => !hasUploadState && onClick?.()}
          >
            <video
              ref={videoRef}
              src={url}
              className="w-full h-full object-cover max-h-100"
              controls={false}
              playsInline
              preload="metadata"
            />

            <div
              className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/40 to-transparent px-3 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
                  title={isPlaying ? "Tạm dừng" : "Phát"}
                  disabled={hasUploadState}
                >
                  {isPlaying ? (
                    <Pause size={14} fill="currentColor" />
                  ) : (
                    <Play size={14} fill="currentColor" className="ml-0.5" />
                  )}
                </button>

                <div className="flex flex-1 items-center gap-2.5">
                  <span className="text-[11px] font-medium text-white/90 tabular-nums drop-shadow-sm">
                    {formatTime(currentTime)}
                  </span>
                  <div className="relative flex h-5 flex-1 items-center group/slider">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.1}
                      value={progressValue}
                      onChange={handleSeek}
                      className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                      aria-label="Tiến trình video"
                      disabled={hasUploadState}
                    />
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/30 transition-all duration-200 group-hover/slider:h-1.5">
                      <div
                        className="h-full bg-primary-500 transition-all duration-75 ease-out"
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                    <div
                      className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-sm opacity-0 transition-opacity duration-200 group-hover/slider:opacity-100 pointer-events-none"
                      style={{ left: `${progressValue}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-white/60 tabular-nums drop-shadow-sm">
                    {formatTime(duration)}
                  </span>
                </div>

                <div className="group/volume flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="p-1.5 text-white/90 transition-colors hover:text-white"
                    title="Tải xuống"
                    disabled={hasUploadState}
                  >
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1.5 text-white/90 transition-colors hover:text-white"
                    title={volume <= 0.01 ? "Bật âm thanh" : "Tắt âm thanh"}
                    disabled={hasUploadState}
                  >
                    {volume <= 0.01 ? (
                      <VolumeX size={16} />
                    ) : (
                      <Volume2 size={16} />
                    )}
                  </button>
                  <div className="w-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover/volume:w-16 group-hover/volume:opacity-100">
                    <div className="relative flex h-5 w-16 items-center">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={handleVolumeChange}
                        className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                        aria-label="Âm lượng video"
                        disabled={hasUploadState}
                      />
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/30">
                        <div
                          className="h-full bg-white"
                          style={{ width: `${volume * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {hasUploadState && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
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
