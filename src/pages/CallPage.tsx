import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCall, type CallType } from "../hooks/useCall";
import { socketService } from "../services";
import { clearActiveCallLock, getFullUrl, setActiveCallLock } from "../utils";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  Eye,
  EyeOff,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LiveKitGroupCall from "../components/chat/LiveKitGroupCall";

interface StreamVideoProps {
  stream: MediaStream;
  muted?: boolean;
  className?: string;
}

interface StreamAudioProps {
  stream: MediaStream;
  muted?: boolean;
}

const StreamVideo: React.FC<StreamVideoProps> = ({
  stream,
  muted = false,
  className = "",
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const tryPlay = () => {
      videoEl.play().catch(() => {
        const previousMuted = videoEl.muted;
        videoEl.muted = true;
        videoEl.play().finally(() => {
          videoEl.muted = muted || previousMuted;
        });
      });
    };

    videoEl.srcObject = stream;
    videoEl.muted = muted;
    tryPlay();
    videoEl.onloadedmetadata = tryPlay;
    videoEl.oncanplay = tryPlay;

    return () => {
      videoEl.onloadedmetadata = null;
      videoEl.oncanplay = null;
      if (videoEl.srcObject === stream) {
        videoEl.srcObject = null;
      }
    };
  }, [stream, muted]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  );
};

const StreamAudio: React.FC<StreamAudioProps> = ({ stream, muted = false }) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const tryPlay = () => {
      audioEl.play().catch(() => {
        const previousMuted = audioEl.muted;
        audioEl.muted = true;
        audioEl.play().finally(() => {
          audioEl.muted = muted || previousMuted;
        });
      });
    };

    audioEl.srcObject = stream;
    audioEl.muted = muted;
    tryPlay();
    audioEl.onloadedmetadata = tryPlay;
    audioEl.oncanplay = tryPlay;

    return () => {
      audioEl.onloadedmetadata = null;
      audioEl.oncanplay = null;
      if (audioEl.srcObject === stream) {
        audioEl.srcObject = null;
      }
    };
  }, [stream, muted]);

  return <audio ref={audioRef} autoPlay playsInline muted={muted} />;
};

const normalizeCallType = (value: string | null): CallType =>
  value === "voice" ? "voice" : "video";

const formatCallDuration = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const getAvatarInitial = (name: string): string => {
  const normalized = String(name || "").trim();
  return normalized ? normalized.charAt(0).toUpperCase() : "U";
};

const isUsableAvatar = (value?: string | null): boolean => {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  if (normalized === "null" || normalized === "undefined") return false;
  return true;
};

const CallPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const conversationId = searchParams.get("conversationId") || "";
  const callType = normalizeCallType(searchParams.get("type"));
  const action = searchParams.get("action") || "start";
  const conversationName = searchParams.get("name") || "Cuoc goi";
  const remoteDisplayName = String(conversationName || "Cuoc goi").trim();
  const remoteAvatar = String(searchParams.get("avatar") || "").trim();
  const myDisplayName = String(
    currentUser?.fullName || "Me",
  ).trim();
  const myAvatar = String(currentUser?.avatarUrl || "").trim();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLocalPreviewVisible, setIsLocalPreviewVisible] = useState(true);
  const [isLocalVideoCollapsed, setIsLocalVideoCollapsed] = useState(false);
  const [isRemoteVideoActive, setIsRemoteVideoActive] = useState(false);
  const [isRemoteAvatarBroken, setIsRemoteAvatarBroken] = useState(false);
  const [isMyAvatarBroken, setIsMyAvatarBroken] = useState(false);

  const rawUser = currentUser as { id?: string; user_id?: string; _id?: string } | null;
  const normalizedUserId = rawUser?.id || rawUser?.user_id || rawUser?._id || "";
  const startedRef = useRef(false);
  const callConnectedAtRef = useRef<number | null>(null);
  const hasEverConnectedRef = useRef(false);
  const hasRemoteAnsweredRef = useRef(false);
  const isClosingByNoAnswerRef = useRef(false);
  const isClosingByCancelRef = useRef(false);

  const {
    isInCall,
    isConnecting,
    localStream,
    remoteStreams,
    participants,
    isMuted,
    isCameraOff,
    isScreenSharing,
    remoteCameraStates,
    busyUserIds,
    isGroup,
    livekitToken,
    startCall,
    joinExistingCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    stopLocalStream,
  } = useCall({
    conversationId,
    userId: normalizedUserId,
  });

  // Release camera/mic for LiveKit when entering group mode
  useEffect(() => {
    if (isGroup && livekitToken && localStream) {
      console.log("Releasing local stream for group call transition...");
      stopLocalStream();
    }
  }, [isGroup, livekitToken, localStream, stopLocalStream]);

  // Khi người nhận đang bận: thông báo về parent window rồi đóng tab này
  useEffect(() => {
    if (busyUserIds && busyUserIds.length > 0) {
      // Gửi tên người nhận về ChatPage để hiện modal
      const opener = window.opener;
      if (opener) {
        opener.postMessage({ type: "call-target-busy", name: remoteDisplayName }, "*");
      }
      // Đóng cửa sổ gọi
      endCall();
      setTimeout(() => {
        window.close();
        window.location.href = "about:blank";
      }, 200);
    }
  }, [busyUserIds, endCall, remoteDisplayName]);

  const hasRemoteAnswered =
    participants.some((id) => String(id) !== String(normalizedUserId || "")) ||
    remoteStreams.length > 0;

  useEffect(() => {
    socketService.connect();
    if (normalizedUserId) {
      socketService.joinUserRoom(normalizedUserId);
    }
  }, [normalizedUserId]);

  useEffect(() => {
    if (!conversationId || !normalizedUserId || startedRef.current) return;

    startedRef.current = true;

    const isGroupUrl = searchParams.get("isGroup") === "true";

    if (action === "join") {
      joinExistingCall(callType, isGroupUrl).catch((error) => {
        console.error("Khong the tham gia cuoc goi:", error);
      });
      return;
    }

    const invitedUserIdsStr = searchParams.get("invitedUserIds");
    const invitedUserIds = invitedUserIdsStr ? invitedUserIdsStr.split(",") : undefined;

    startCall(callType, invitedUserIds, isGroupUrl).catch((error) => {
      console.error("Khong the bat dau cuoc goi:", error);
    });
  }, [
    action,
    callType,
    conversationId,
    joinExistingCall,
    normalizedUserId,
    startCall,
  ]);

  useEffect(() => {
    if (isInCall && hasRemoteAnswered) {
      hasEverConnectedRef.current = true;
      hasRemoteAnsweredRef.current = true;
      if (!callConnectedAtRef.current) {
        callConnectedAtRef.current = Date.now();
      }
    }

    if (!isInCall || !hasRemoteAnswered) {
      callConnectedAtRef.current = null;
      setElapsedSeconds(0);
    }
  }, [hasRemoteAnswered, isInCall]);

  useEffect(() => {
    if (!isInCall || !hasRemoteAnswered || !callConnectedAtRef.current) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!callConnectedAtRef.current) return;
      const deltaSeconds = Math.floor(
        (Date.now() - callConnectedAtRef.current) / 1000,
      );
      setElapsedSeconds(deltaSeconds);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasRemoteAnswered, isInCall]);

  useEffect(() => {
    if (!conversationId || !normalizedUserId) return;

    const onDeclined = (payload: {
      conversationId: string;
      userId: string;
    }) => {
      if (payload.conversationId !== conversationId) return;

      console.log(`Cuộc gọi bị từ chối bởi: ${payload.userId}`);
      
      // Nếu là cuộc gọi nhóm, không được kết thúc cuộc gọi của mình khi người khác từ chối
      if (!isGroup) {
        isClosingByCancelRef.current = true;
        endCall();
      }
    };

    const onCallEnded = (payload: {
      conversationId: string;
      endedBy?: string | null;
    }) => {
      if (payload.conversationId !== conversationId) return;

      if (!hasRemoteAnsweredRef.current) {
        isClosingByNoAnswerRef.current = true;
      }

      endCall();
    };

    socketService.onCallDeclined(onDeclined);
    socketService.onCallEnded(onCallEnded);
    return () => {
      socketService.offCallDeclined(onDeclined);
      socketService.offCallEnded(onCallEnded);
    };
  }, [conversationId, endCall, normalizedUserId]);

  const handleExit = () => {
    endCall();
    // window.opener chỉ tồn tại khi window được mở bằng window.open — an toàn để close
    if (window.opener) {
      window.close();
      return;
    }
    navigate("/chat");
  };

  useEffect(() => {
    if (!isConnecting && !isInCall) {
      if (
        hasEverConnectedRef.current ||
        isClosingByNoAnswerRef.current ||
        isClosingByCancelRef.current
      ) {
        // Chỉ tự đóng khi có opener (mở bằng window.open), không dùng window.name
        // vì window.name tồn tại qua F5 và sẽ gây đóng trang khi reload
        if (window.opener) {
          window.close();
          return;
        }
        navigate("/chat");
      }
    }
  }, [isConnecting, isInCall, navigate]);

  const primaryRemote = remoteStreams[0];
  const remoteAvatarSrc = isUsableAvatar(remoteAvatar)
    ? getFullUrl(remoteAvatar)
    : "";
  const myAvatarSrc = isUsableAvatar(myAvatar) ? getFullUrl(myAvatar) : "";

  useEffect(() => {
    setIsRemoteAvatarBroken(false);
  }, [remoteAvatar]);

  useEffect(() => {
    setIsMyAvatarBroken(false);
  }, [myAvatar]);

  useEffect(() => {
    if (!conversationId) return;
    if (!isInCall && !isConnecting) return;

    setActiveCallLock(conversationId);
    const intervalId = window.setInterval(() => {
      setActiveCallLock(conversationId);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
      clearActiveCallLock(conversationId);
    };
  }, [conversationId, isConnecting, isInCall]);

  useEffect(() => {
    if (callType !== "video") {
      setIsRemoteVideoActive(false);
      return;
    }

    const stream = primaryRemote?.stream;
    if (!stream) {
      setIsRemoteVideoActive(false);
      return;
    }

    const [videoTrack] = stream.getVideoTracks();
    if (!videoTrack) {
      setIsRemoteVideoActive(false);
      return;
    }

    const syncRemoteVideoState = () => {
      const isCameraOffByRemote = primaryRemote?.userId
        ? remoteCameraStates[primaryRemote.userId] === true
        : false;

      setIsRemoteVideoActive(
        videoTrack.readyState === "live" && !videoTrack.muted && !isCameraOffByRemote,
      );
    };

    syncRemoteVideoState();
    videoTrack.addEventListener("mute", syncRemoteVideoState);
    videoTrack.addEventListener("unmute", syncRemoteVideoState);
    videoTrack.addEventListener("ended", syncRemoteVideoState);

    return () => {
      videoTrack.removeEventListener("mute", syncRemoteVideoState);
      videoTrack.removeEventListener("unmute", syncRemoteVideoState);
      videoTrack.removeEventListener("ended", syncRemoteVideoState);
    };
  }, [callType, primaryRemote, remoteCameraStates]);

  if (isGroup && livekitToken) {
    return (
      <LiveKitGroupCall
        token={livekitToken}
        serverUrl={import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7880"}
        onLeave={handleExit}
        video={callType === "video"}
      />
    );
  }

  if (!conversationId) {
    return (
      <div className="h-screen w-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">
            Khong tim thay thong tin cuoc goi
          </p>
          <button
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
            onClick={() => navigate("/chat")}
          >
            Quay lai chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-primary-900 flex flex-col overflow-hidden relative font-body text-white">
      {/* 1. NỀN: Video người đối diện */}
      <div className="absolute inset-0 z-0 bg-primary-900">
        {primaryRemote ? (
          callType === "video" ? (
            <>
              <StreamAudio stream={primaryRemote.stream} />
              {isRemoteVideoActive ? (
                <StreamVideo
                  stream={primaryRemote.stream}
                  className="w-full h-full object-cover opacity-90"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center bg-radial from-primary-800 to-primary-950">
                  <div className="h-40 w-40 rounded-full border-4 border-primary-400/30 bg-primary-700 flex items-center justify-center text-5xl font-display shadow-2xl overflow-hidden">
                    {remoteAvatarSrc && !isRemoteAvatarBroken ? (
                      <img
                        src={remoteAvatarSrc}
                        alt={remoteDisplayName}
                        className="h-full w-full object-cover"
                        onError={() => setIsRemoteAvatarBroken(true)}
                      />
                    ) : (
                      getAvatarInitial(remoteDisplayName)
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-radial from-primary-800 to-primary-950">
              <StreamAudio stream={primaryRemote.stream} />
              <div className="h-40 w-40 rounded-full border-4 border-primary-400/30 bg-primary-700 flex items-center justify-center text-5xl font-display shadow-2xl animate-pulse-slow overflow-hidden">
                {remoteAvatarSrc && !isRemoteAvatarBroken ? (
                  <img
                    src={remoteAvatarSrc}
                    alt={remoteDisplayName}
                    className="h-full w-full object-cover"
                    onError={() => setIsRemoteAvatarBroken(true)}
                  />
                ) : (
                  getAvatarInitial(remoteDisplayName)
                )}
              </div>
            </div>
          )
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-primary-950">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-3 border-primary-700 border-t-primary-300 rounded-full animate-spin" />
              <p className="text-primary-300 font-medium text-sm tracking-wide">
                Đang chờ kết nối...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lớp phủ Gradient để text dễ đọc hơn */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-linear-to-b from-primary-950/70 via-transparent to-primary-950/80" />

      {/* 2. TOP BAR: Thông tin cuộc gọi */}
      <div className="absolute top-6 left-6 right-6 z-10 flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-white/20 bg-primary-700 flex items-center justify-center text-sm font-bold shadow-lg shrink-0">
              {remoteAvatarSrc && !isRemoteAvatarBroken ? (
                <img
                  src={remoteAvatarSrc}
                  alt={remoteDisplayName}
                  className="h-full w-full object-cover"
                  onError={() => setIsRemoteAvatarBroken(true)}
                />
              ) : (
                getAvatarInitial(remoteDisplayName)
              )}
            </div>

            {/* CHỈ HIỆN KHI ĐÃ TRẢ LỜI: Layout màu tối, chữ xanh neon */}
            {hasRemoteAnswered && (
              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-inner flex items-center justify-center">
                <span className="text-sm font-bold tracking-wider text-[#00FF7F] drop-shadow-[0_0_8px_rgba(0,255,127,0.6)]">
                  {formatCallDuration(elapsedSeconds)}
                </span>
              </div>
            )}
            <h2 className="font-display text-xl drop-shadow-lg text-primary-50">
              {remoteDisplayName}
            </h2>
          </div>
          {!hasRemoteAnswered && action === "start" && (
            <span className="text-[11px] uppercase tracking-widest text-primary-300 animate-pulse bg-black/20 px-2 py-0.5 rounded w-fit">
              Đang đổ chuông...
            </span>
          )}
        </div>

        {/* 3. Local Video (PiP) - Collapsible logic */}
        {callType === "video" && isLocalPreviewVisible && (
          <div
            className={`transition-all duration-500 ease-in-out relative ${isLocalVideoCollapsed ? "translate-x-[calc(100%-12px)]" : "translate-x-0"
              }`}
          >
            <div className="w-32 md:w-48 aspect-video rounded-xl border border-white/10 overflow-hidden bg-primary-800 shadow-2xl relative group">
              {/* Toggle Collapse Button (Chevron only) */}
              <button
                onClick={() => setIsLocalVideoCollapsed((prev) => !prev)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-full bg-transparent flex items-center justify-center text-white transition-all hover:scale-110"
                title={isLocalVideoCollapsed ? "Hiện khung hình" : "Ẩn khung hình"}
              >
                {isLocalVideoCollapsed ? (
                  <ChevronLeft size={24} strokeWidth={2.5} />
                ) : (
                  <ChevronRight size={24} strokeWidth={2.5} />
                )}
              </button>

              {localStream && !isCameraOff ? (
                <StreamVideo
                  stream={localStream}
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-900">
                  <div className="h-10 w-10 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-white border border-white/10 overflow-hidden">
                    {myAvatarSrc && !isMyAvatarBroken ? (
                      <img
                        src={myAvatarSrc}
                        alt={myDisplayName}
                        className="h-full w-full object-cover"
                        onError={() => setIsMyAvatarBroken(true)}
                      />
                    ) : (
                      getAvatarInitial(myDisplayName)
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. BOTTOM BAR: Điều khiển - ĐÃ THU NHỎ (w-10, h-10) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-3 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-4xl flex items-center gap-4 shadow-2xl">
        {/* Mic toggle */}
        <button
          onClick={toggleMic}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${isMuted
            ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
            : "bg-white/10 hover:bg-white/20 text-white"
            }`}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Camera toggle */}
        {callType === "video" && (
          <button
            onClick={toggleCamera}
            disabled={isScreenSharing}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${isCameraOff
              ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
              : "bg-white/10 hover:bg-white/20 text-white"
              } ${isScreenSharing ? "opacity-20" : ""}`}
          >
            {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
        )}

        {/* Nút Kết thúc - Nổi bật nhất */}
        <button
          onClick={handleExit}
          className="w-12 h-12 rounded-2xl bg-[#A82828] hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-red-500/30"
        >
          <PhoneOff size={22} fill="currentColor" stroke="none" />
        </button>

        {/* Screen Share */}
        {callType === "video" && (
          <button
            onClick={toggleScreenShare}
            disabled={!hasRemoteAnswered}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isScreenSharing
              ? "bg-primary-400 text-black"
              : "bg-white/10 hover:bg-white/20 text-white"
              } ${!hasRemoteAnswered ? "opacity-20" : ""}`}
          >
            <MonitorUp size={18} />
          </button>
        )}

        {/* Toggle local preview */}

        {/* Settings */}
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
          <Settings size={18} />
        </button>
      </div>

      {/* Overlay kết thúc cuộc gọi */}
      {!isInCall && !isConnecting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-primary-800 p-8 rounded-3xl shadow-2xl border border-primary-400/20 text-center scale-in">
            <h3 className="text-2xl font-display text-primary-50 mb-2">
              Cuộc gọi đã kết thúc
            </h3>
            <p className="text-primary-300 text-sm">
              Cảm ơn bạn đã sử dụng Riff
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallPage;
