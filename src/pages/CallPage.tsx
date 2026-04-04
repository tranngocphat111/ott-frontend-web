import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useCall, type CallType } from "../hooks/useCall";
import { socketService } from "../services";

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

const CallPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const conversationId = searchParams.get("conversationId") || "";
  const callType = normalizeCallType(searchParams.get("type"));
  const action = searchParams.get("action") || "start";
  const conversationName = searchParams.get("name") || "Cuoc goi";

  const normalizedUserId = currentUser?.user_id || currentUser?._id || "";
  const startedRef = useRef(false);

  const {
    isInCall,
    isConnecting,
    localStream,
    remoteStreams,
    participants,
    isMuted,
    isCameraOff,
    startCall,
    joinExistingCall,
    endCall,
    toggleMic,
    toggleCamera,
  } = useCall({
    conversationId,
    userId: normalizedUserId,
  });

  const displayedParticipantCount = useMemo(
    () =>
      Math.max(
        participants.length,
        remoteStreams.length + (localStream ? 1 : 0),
      ) || 1,
    [participants.length, remoteStreams.length, localStream],
  );

  useEffect(() => {
    socketService.connect();
    if (normalizedUserId) {
      socketService.joinUserRoom(normalizedUserId);
    }
  }, [normalizedUserId]);

  useEffect(() => {
    if (!conversationId || !normalizedUserId || startedRef.current) return;

    startedRef.current = true;

    if (action === "join") {
      joinExistingCall(callType).catch((error) => {
        console.error("Khong the tham gia cuoc goi:", error);
      });
      return;
    }

    startCall(callType).catch((error) => {
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

  const handleExit = () => {
    endCall();
    if (window.opener) {
      window.close();
      return;
    }
    navigate("/chat");
  };

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
    <div className="h-screen w-screen bg-slate-950 p-4 md:p-6 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white text-xl font-semibold">
            {conversationName}
          </h2>
          <p className="text-slate-300 text-sm">
            {isConnecting
              ? "Dang ket noi..."
              : `${displayedParticipantCount} nguoi tham gia`}
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-auto">
        {localStream && (
          <div className="rounded-xl border border-slate-700 bg-slate-900 relative min-h-48">
            {callType === "video" ? (
              <>
                <StreamAudio stream={localStream} muted />
                <StreamVideo
                  stream={localStream}
                  muted
                  className="w-full h-full rounded-xl object-cover"
                />
              </>
            ) : (
              <>
                <StreamAudio stream={localStream} muted />
                <div className="w-full h-full rounded-xl flex items-center justify-center text-slate-300">
                  Voice call - Ban
                </div>
              </>
            )}
            <span className="absolute left-3 bottom-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs">
              Ban
            </span>
          </div>
        )}

        {remoteStreams.map((item) => (
          <div
            key={item.userId}
            className="rounded-xl border border-slate-700 bg-slate-900 relative min-h-48"
          >
            {callType === "video" ? (
              <>
                <StreamAudio stream={item.stream} />
                <StreamVideo
                  stream={item.stream}
                  className="w-full h-full rounded-xl object-cover"
                />
              </>
            ) : (
              <>
                <StreamAudio stream={item.stream} />
                <div className="w-full h-full rounded-xl flex items-center justify-center text-slate-300">
                  Voice call - {item.userId}
                </div>
              </>
            )}
            <span className="absolute left-3 bottom-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs">
              {item.userId}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          onClick={toggleMic}
          className="w-12 h-12 rounded-full bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center"
          title={isMuted ? "Bat mic" : "Tat mic"}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {callType === "video" && (
          <button
            onClick={toggleCamera}
            className="w-12 h-12 rounded-full bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center"
            title={isCameraOff ? "Bat camera" : "Tat camera"}
          >
            {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
        )}

        <button
          onClick={handleExit}
          className="w-14 h-14 rounded-full bg-red-600 text-white hover:bg-red-500 flex items-center justify-center"
          title="Ket thuc cuoc goi"
        >
          <PhoneOff size={20} />
        </button>
      </div>

      {!isInCall && !isConnecting && (
        <p className="text-center text-slate-400 text-sm mt-3">
          Cuoc goi da ket thuc hoac chua duoc thiet lap.
        </p>
      )}
    </div>
  );
};

export default CallPage;
