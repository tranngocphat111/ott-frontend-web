import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socketService } from "../services";

export type CallType = "voice" | "video";

interface IncomingCall {
  conversationId: string;
  callId?: string;
  callerId: string;
  callType: CallType;
  isGroup?: boolean;
}

interface UseCallOptions {
  conversationId?: string;
  userId?: string;
}

interface RemoteStreamItem {
  userId: string;
  stream: MediaStream;
}

const buildRtcConfig = (): RTCConfiguration => {
  const baseIceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as
    | string
    | undefined;

  if (turnUrl && turnUsername && turnCredential) {
    baseIceServers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return { iceServers: baseIceServers };
};

const rtcConfig: RTCConfiguration = buildRtcConfig();
const FAKE_MEDIA_STORAGE_KEY = "riff_call_use_fake_media";

type WebkitAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const shouldUseFakeCallMedia = () => {
  const envValue = String(
    import.meta.env.VITE_CALL_FAKE_MEDIA || "",
  ).toLowerCase();
  const storageValue = String(
    localStorage.getItem(FAKE_MEDIA_STORAGE_KEY) || "",
  ).toLowerCase();
  const queryValue = new URLSearchParams(window.location.search)
    .get("fakeMedia")
    ?.toLowerCase();

  return [envValue, storageValue, queryValue].some((value) =>
    ["1", "true", "yes", "on"].includes(value || ""),
  );
};

const stopTrack = (track?: MediaStreamTrack | null) => {
  if (track && track.readyState !== "ended") {
    track.stop();
  }
};

const patchTrackStop = (
  track: MediaStreamTrack | null,
  cleanup: () => void,
) => {
  if (!track) return;

  const originalStop = track.stop.bind(track);
  let cleaned = false;
  const runCleanup = () => {
    if (cleaned) return;
    cleaned = true;
    cleanup();
  };

  track.stop = () => {
    runCleanup();
    originalStop();
  };
  track.addEventListener("ended", runCleanup, { once: true });
};

const isLiveTrack = (track?: MediaStreamTrack | null) =>
  Boolean(track && track.readyState === "live");

const enableTrack = (track?: MediaStreamTrack | null) => {
  if (track && track.readyState === "live") {
    track.enabled = true;
  }
};

const ensureTransceivers = (pc: RTCPeerConnection, mode: CallType) => {
  const transceivers = pc.getTransceivers();
  const hasAudio = transceivers.some((t) => t.receiver.track?.kind === "audio");
  const hasVideo = transceivers.some((t) => t.receiver.track?.kind === "video");

  if (!hasAudio) {
    pc.addTransceiver("audio", { direction: "sendrecv" });
  }

  if (mode === "video" && !hasVideo) {
    pc.addTransceiver("video", { direction: "sendrecv" });
  }
};

export const useCall = ({ conversationId, userId }: UseCallOptions) => {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [callType, setCallType] = useState<CallType | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [busyUserIds, setBusyUserIds] = useState<string[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamItem[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteCameraStates, setRemoteCameraStates] = useState<
    Record<string, boolean>
  >({});
  const [isGroup, setIsGroup] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [localStreamRevision, setLocalStreamRevision] = useState(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteMediaStreamRef = useRef<Map<string, MediaStream>>(new Map());
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );
  const activeConversationRef = useRef<string | null>(null);
  const activeCallIdRef = useRef<string | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackBeforeShareRef = useRef<MediaStreamTrack | null>(null);
  const cameraOffBeforeShareRef = useRef(false);
  const isGroupRef = useRef(false);
  const closeCallLocallyRef = useRef<(() => void) | null>(null);
  const peerDisconnectTimersRef = useRef<Map<string, number>>(new Map());
  const hasRemoteConnectedRef = useRef(false);
  const callConnectedAtRef = useRef<number | null>(null);
  const hasEmittedCallEndRef = useRef(false);
  const hasDeclinedIncomingCallRef = useRef(false);
  const userIdRef = useRef(userId);
  const callTypeRef = useRef<CallType | null>(callType);

  const canHandleCall = Boolean(conversationId && userId);

  const setLocalStreamRef = useCallback((stream: MediaStream | null) => {
    localStreamRef.current = stream;
    setLocalStreamRevision((revision) => revision + 1);
  }, []);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    callTypeRef.current = callType;
  }, [callType]);

  const setActiveCallId = useCallback((nextCallId?: string | null) => {
    const normalizedCallId = String(nextCallId || "").trim();
    activeCallIdRef.current = normalizedCallId || null;
    setCurrentCallId(normalizedCallId || null);
  }, []);

  const isPayloadForActiveCall = useCallback(
    (payload: { conversationId?: string; callId?: string | null }) => {
      if (
        !activeConversationRef.current ||
        payload.conversationId !== activeConversationRef.current
      ) {
        return false;
      }

      const activeCallId = activeCallIdRef.current;
      const payloadCallId = String(payload.callId || "").trim();

      if (activeCallId && !payloadCallId) {
        return false;
      }

      if (activeCallId && payloadCallId && payloadCallId !== activeCallId) {
        return false;
      }

      if (!activeCallId && payloadCallId) {
        setActiveCallId(payloadCallId);
      }

      return true;
    },
    [setActiveCallId],
  );

  useEffect(() => {
    isGroupRef.current = isGroup;
  }, [isGroup]);

  const resetCallState = useCallback(() => {
    setIsInCall(false);
    setIsConnecting(false);
    setCallType(null);
    setBusyUserIds([]);
    setParticipants([]);
    setRemoteStreams([]);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setRemoteCameraStates({});
    setIsGroup(false);
    isGroupRef.current = false;
    setLivekitToken(null);
    remoteMediaStreamRef.current.clear();
    pendingIceCandidatesRef.current.clear();
    activeConversationRef.current = null;
    activeCallIdRef.current = null;
    setCurrentCallId(null);
    screenTrackRef.current = null;
    cameraTrackBeforeShareRef.current = null;
    cameraOffBeforeShareRef.current = false;
    hasRemoteConnectedRef.current = false;
    callConnectedAtRef.current = null;
    hasEmittedCallEndRef.current = false;
    hasDeclinedIncomingCallRef.current = false;
  }, []);

  const stopLocalStream = useCallback(() => {
    const currentScreenTrack = screenTrackRef.current;
    if (currentScreenTrack) {
      currentScreenTrack.onended = null;
      stopTrack(currentScreenTrack);
      screenTrackRef.current = null;
    }

    stopTrack(cameraTrackBeforeShareRef.current);
    cameraTrackBeforeShareRef.current = null;
    cameraOffBeforeShareRef.current = false;

    localStreamRef.current?.getTracks().forEach(stopTrack);
    setLocalStreamRef(null);
  }, [setLocalStreamRef]);

  const clearPeerDisconnectTimer = useCallback((targetUserId: string) => {
    const timerId = peerDisconnectTimersRef.current.get(targetUserId);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      peerDisconnectTimersRef.current.delete(targetUserId);
    }
  }, []);

  const cleanupPeer = useCallback((targetUserId: string) => {
    clearPeerDisconnectTimer(targetUserId);
    const existing = peerConnectionsRef.current.get(targetUserId);
    if (!existing) return;

    existing.onicecandidate = null;
    existing.ontrack = null;
    existing.onconnectionstatechange = null;
    existing.close();
    peerConnectionsRef.current.delete(targetUserId);
    remoteMediaStreamRef.current.delete(targetUserId);
    pendingIceCandidatesRef.current.delete(targetUserId);

    setRemoteCameraStates((prev) => {
      if (!(targetUserId in prev)) return prev;
      const copy = { ...prev };
      delete copy[targetUserId];
      return copy;
    });

    setRemoteStreams((prev) =>
      prev.filter((item) => item.userId !== targetUserId),
    );
  }, [clearPeerDisconnectTimer]);

  const cleanupAllPeers = useCallback(() => {
    Array.from(peerConnectionsRef.current.keys()).forEach((targetUserId) => {
      cleanupPeer(targetUserId);
    });
  }, [cleanupPeer]);

  const markRemoteConnected = useCallback(() => {
    hasRemoteConnectedRef.current = true;
    if (!callConnectedAtRef.current) {
      callConnectedAtRef.current = Date.now();
    }
  }, []);

  const createFakeStream = useCallback((name: string, mode: CallType): MediaStream => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    let animationId: number | null = null;
    let videoTrack: MediaStreamTrack | null = null;

    if (ctx) {
      // Vẽ nền gradient tối
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      gradient.addColorStop(0, "#1e293b");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vẽ text tên người dùng
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name || "User", canvas.width / 2, canvas.height / 2);
      ctx.font = "20px sans-serif";
      ctx.fillText(
        "(Camera Simulation)",
        canvas.width / 2,
        canvas.height / 2 + 50,
      );

      // Animation đơn giản
      let offset = 0;
      const animate = () => {
        if (mode !== "video" || videoTrack?.readyState === "ended") return;

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 40px sans-serif";
        ctx.fillText(
          name || "User",
          canvas.width / 2,
          canvas.height / 2 + Math.sin(offset) * 10,
        );
        ctx.font = "20px sans-serif";
        ctx.fillText(
          "(Camera Simulation)",
          canvas.width / 2,
          canvas.height / 2 + 50,
        );
        offset += 0.1;
        animationId = requestAnimationFrame(animate);
      };
      if (mode === "video") animationId = requestAnimationFrame(animate);
    }

    const stream = canvas.captureStream(30);
    videoTrack = stream.getVideoTracks()[0] || null;
    patchTrackStop(videoTrack, () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    });
    
    // Tạo silent audio track
    const AudioContextCtor =
      window.AudioContext ||
      (window as WebkitAudioWindow).webkitAudioContext;

    if (!AudioContextCtor) {
      return videoTrack ? new MediaStream([videoTrack]) : new MediaStream();
    }

    const audioCtx = new AudioContextCtor();
    const oscillator = audioCtx.createOscillator();
    const destination = audioCtx.createMediaStreamDestination();
    oscillator.connect(destination);
    oscillator.start();
    const silentAudioTrack = destination.stream.getAudioTracks()[0];
    patchTrackStop(silentAudioTrack, () => {
      try {
        oscillator.stop();
      } catch {
        // Oscillator may already be stopped by the browser.
      }
      audioCtx.close().catch(() => undefined);
    });
    
    if (mode === "voice") {
      return new MediaStream([silentAudioTrack]);
    }
    
    return new MediaStream(
      [videoTrack, silentAudioTrack].filter(
        (track): track is MediaStreamTrack => Boolean(track),
      ),
    );
  }, []);

  const acquireAudioTrack = useCallback(async () => {
    if (shouldUseFakeCallMedia()) {
      const fakeStream = createFakeStream(userId || "User", "voice");
      const audioTrack = fakeStream.getAudioTracks()[0] || null;
      enableTrack(audioTrack);
      return audioTrack;
    }

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      const [audioTrack] = media.getAudioTracks();
      media.getVideoTracks().forEach(stopTrack);
      enableTrack(audioTrack);
      return audioTrack || null;
    } catch (error) {
      console.warn(
        "Khong the bat micro, se vao cuoc goi o trang thai tat mic:",
        error,
      );
      return null;
    }
  }, [createFakeStream, userId]);

  const acquireVideoTrack = useCallback(async () => {
    if (shouldUseFakeCallMedia()) {
      const fakeStream = createFakeStream(userId || "User", "video");
      fakeStream.getAudioTracks().forEach(stopTrack);
      const videoTrack = fakeStream.getVideoTracks()[0] || null;
      enableTrack(videoTrack);
      return videoTrack;
    }

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      const [videoTrack] = media.getVideoTracks();
      media.getAudioTracks().forEach(stopTrack);
      enableTrack(videoTrack);
      return videoTrack || null;
    } catch (error) {
      console.warn(
        "Khong the bat camera, se vao cuoc goi o trang thai tat cam:",
        error,
      );
      return null;
    }
  }, [createFakeStream, userId]);

  const ensureLocalStream = useCallback(async (mode: CallType) => {
    const existing = localStreamRef.current;
    if (existing) {
      const hasAudioTrack = existing.getAudioTracks().some(isLiveTrack);
      const hasVideoTrack = existing.getVideoTracks().some(isLiveTrack);
      if (hasAudioTrack && (mode === "voice" || hasVideoTrack)) {
        existing.getAudioTracks().forEach(enableTrack);
        existing.getVideoTracks().forEach(enableTrack);
        setIsMuted(false);
        setIsCameraOff(mode === "voice" || !hasVideoTrack);
        return existing;
      }

      existing.getTracks().forEach(stopTrack);
      setLocalStreamRef(null);
    }

    if (shouldUseFakeCallMedia()) {
      const fakeStream = createFakeStream(userId || "User", mode);
      fakeStream.getTracks().forEach(enableTrack);
      setLocalStreamRef(fakeStream);
      setIsMuted(false);
      setIsCameraOff(mode === "voice");
      return fakeStream;
    }

    let audioTrack: MediaStreamTrack | null = null;
    let videoTrack: MediaStreamTrack | null = null;

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video",
      });

      audioTrack = media.getAudioTracks().find(isLiveTrack) || null;
      videoTrack =
        mode === "video"
          ? media.getVideoTracks().find(isLiveTrack) || null
          : null;

      media.getTracks().forEach((track) => {
        if (track !== audioTrack && track !== videoTrack) {
          stopTrack(track);
        }
      });
    } catch (error) {
      console.warn(
        "Khong the bat dong thoi micro va camera, thu bat tung thiet bi:",
        error,
      );
      audioTrack = await acquireAudioTrack();
      videoTrack = mode === "video" ? await acquireVideoTrack() : null;
    }

    enableTrack(audioTrack);
    enableTrack(videoTrack);

    const tracks = [audioTrack, videoTrack].filter(
      (track): track is MediaStreamTrack => Boolean(track),
    );
    const stream = new MediaStream(tracks);

    setLocalStreamRef(stream);
    setIsMuted(!audioTrack);
    setIsCameraOff(mode === "voice" || !videoTrack);
    return stream;
  }, [
    acquireAudioTrack,
    acquireVideoTrack,
    createFakeStream,
    setLocalStreamRef,
    userId,
  ]);

  const getOrCreatePeer = useCallback(
    (targetUserId: string, mode: CallType) => {
      const existing = peerConnectionsRef.current.get(targetUserId);
      if (existing) return existing;

      const pc = new RTCPeerConnection(rtcConfig);
      const localStream = localStreamRef.current;

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      ensureTransceivers(pc, mode);

      pc.onicecandidate = (event) => {
        if (!event.candidate || !activeConversationRef.current || !userId)
          return;

        socketService.sendIceCandidate(
          activeConversationRef.current,
          activeCallIdRef.current,
          userId,
          targetUserId,
          event.candidate.toJSON(),
        );
      };

      pc.ontrack = (event) => {
        markRemoteConnected();
        const [firstStream] = event.streams;
        const existingStream = remoteMediaStreamRef.current.get(targetUserId);
        const stream = existingStream || firstStream || new MediaStream();

        if (firstStream) {
          firstStream.getTracks().forEach((track) => {
            const hasTrack = stream.getTracks().some((t) => t.id === track.id);
            if (!hasTrack) {
              stream.addTrack(track);
            }
          });
        }

        const hasCurrentTrack = stream
          .getTracks()
          .some((track) => track.id === event.track.id);
        if (!hasCurrentTrack) {
          stream.addTrack(event.track);
        }

        remoteMediaStreamRef.current.set(targetUserId, stream);

        setRemoteStreams((prev) => {
          const idx = prev.findIndex((item) => item.userId === targetUserId);
          if (idx === -1) {
            return [...prev, { userId: targetUserId, stream }];
          }

          const cloned = [...prev];
          cloned[idx] = { userId: targetUserId, stream };
          return cloned;
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          clearPeerDisconnectTimer(targetUserId);
          return;
        }

        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          if (!peerDisconnectTimersRef.current.has(targetUserId)) {
            const timerId = window.setTimeout(() => {
              cleanupPeer(targetUserId);
              if (!isGroupRef.current) {
                closeCallLocallyRef.current?.();
              }
            }, 6000);
            peerDisconnectTimersRef.current.set(targetUserId, timerId);
          }
          return;
        }

        if (pc.connectionState === "closed") {
          clearPeerDisconnectTimer(targetUserId);
          cleanupPeer(targetUserId);
        }
      };

      peerConnectionsRef.current.set(targetUserId, pc);
      setCallType(mode);
      return pc;
    },
    [cleanupPeer, clearPeerDisconnectTimer, markRemoteConnected, userId],
  );

  const createOfferFor = useCallback(
    async (targetUserId: string, mode: CallType) => {
      if (!activeConversationRef.current || !userId) return;

      const pc = getOrCreatePeer(targetUserId, mode);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: mode === "video",
      });
      await pc.setLocalDescription(offer);

      socketService.sendOffer(
        activeConversationRef.current,
        activeCallIdRef.current,
        userId,
        targetUserId,
        offer,
        mode,
      );
    },
    [getOrCreatePeer, userId],
  );

  const queueIceCandidate = useCallback(
    (targetUserId: string, candidate: RTCIceCandidateInit) => {
      const current = pendingIceCandidatesRef.current.get(targetUserId) || [];
      current.push(candidate);
      pendingIceCandidatesRef.current.set(targetUserId, current);
    },
    [],
  );

  const flushPendingIceCandidates = useCallback(
    async (targetUserId: string, pc: RTCPeerConnection) => {
      const pending = pendingIceCandidatesRef.current.get(targetUserId);
      if (!pending?.length) return;

      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Áp dụng ICE candidate chờ thất bại:", error);
        }
      }

      pendingIceCandidatesRef.current.delete(targetUserId);
    },
    [],
  );

  const replaceOutgoingVideoTrack = useCallback(
    (nextTrack: MediaStreamTrack | null) => {
      peerConnectionsRef.current.forEach((pc) => {
        const sender =
          pc
            .getTransceivers()
            .find(
              (item) =>
                item.sender.track?.kind === "video" ||
                item.receiver.track?.kind === "video",
            )?.sender ||
          pc.getSenders().find((item) => item.track?.kind === "video");

        if (sender && typeof sender.replaceTrack === "function") {
          sender.replaceTrack(nextTrack).catch((error) => {
            console.error("Khong the cap nhat video track:", error);
          });
        }
      });
    },
    [],
  );

  const replaceOutgoingAudioTrack = useCallback(
    (nextTrack: MediaStreamTrack | null) => {
      peerConnectionsRef.current.forEach((pc) => {
        const sender =
          pc
            .getTransceivers()
            .find(
              (item) =>
                item.sender.track?.kind === "audio" ||
                item.receiver.track?.kind === "audio",
            )?.sender ||
          pc.getSenders().find((item) => item.track?.kind === "audio");

        if (sender && typeof sender.replaceTrack === "function") {
          sender.replaceTrack(nextTrack).catch((error) => {
            console.error("Khong the cap nhat audio track:", error);
          });
        }
      });
    },
    [],
  );

  const releaseLocalVideoTracks = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    stream.getVideoTracks().forEach((track) => {
      stream.removeTrack(track);
      stopTrack(track);
    });
    replaceOutgoingVideoTrack(null);
  }, [replaceOutgoingVideoTrack]);

  const closeCallLocally = useCallback(() => {
    cleanupAllPeers();
    stopLocalStream();
    resetCallState();
    setIncomingCall(null);
  }, [cleanupAllPeers, resetCallState, stopLocalStream]);

  useEffect(() => {
    closeCallLocallyRef.current = closeCallLocally;
  }, [closeCallLocally]);

  const emitEndCallOnce = useCallback(
    (activeConversationId: string) => {
      const activeUserId = userIdRef.current;

      if (!activeUserId || hasEmittedCallEndRef.current) {
        return Promise.resolve(false);
      }

      hasEmittedCallEndRef.current = true;
      const durationSeconds = callConnectedAtRef.current
        ? Math.max(
            0,
            Math.floor((Date.now() - callConnectedAtRef.current) / 1000),
          )
        : 0;

      return socketService.endCall(activeConversationId, activeUserId, {
        callId: activeCallIdRef.current,
        callType: callTypeRef.current || undefined,
        wasConnected: hasRemoteConnectedRef.current,
        durationSeconds,
      }).catch((error) => {
        console.error("Khong the gui tin hieu ket thuc cuoc goi:", error);
        return false;
      });
    },
    [],
  );

  const emitLocalCameraState = useCallback((cameraOff: boolean) => {
    if (!activeConversationRef.current || !userId) return;
    socketService.emitCameraState(
      activeConversationRef.current,
      userId,
      cameraOff,
      activeCallIdRef.current,
    );
  }, [userId]);

  const startCall = useCallback(
    async (mode: CallType, invitedUserIds?: string[], isGroupCall?: boolean) => {
      if (!canHandleCall || !conversationId || !userId) return;

      try {
        const effectiveMode: CallType = isGroupCall ? "video" : mode;
        setIsConnecting(true);
        setBusyUserIds([]);
        
        await ensureLocalStream(effectiveMode);

        activeConversationRef.current = conversationId;
        setCallType(effectiveMode);
        isGroupRef.current = !!isGroupCall;
        setIsGroup(!!isGroupCall);
        setIsInCall(true);

        const response = await socketService.startCall(
          conversationId,
          userId,
          effectiveMode,
          invitedUserIds,
        );

        if (!response?.ok && response?.reason === "busy" && response.targetUserId) {
          setBusyUserIds([response.targetUserId]);
          setIsInCall(false);
          stopLocalStream();
          return;
        }

        if (!response?.ok) {
          throw new Error(response?.reason || "start_call_failed");
        }

        if (response?.callId) {
          setActiveCallId(response.callId);
        }
        if (response?.participants) {
          setParticipants(response.participants);
        }
        if (response?.livekitToken) {
          setLivekitToken(response.livekitToken);
        }
        if (effectiveMode === "video") {
          emitLocalCameraState(
            !localStreamRef.current?.getVideoTracks().some(isLiveTrack),
          );
        }
      } catch (error) {
        console.error("Không thể bắt đầu cuộc gọi:", error);
        resetCallState();
        stopLocalStream();
      } finally {
        setIsConnecting(false);
      }
    },
    [
      canHandleCall,
      conversationId,
      emitLocalCameraState,
      ensureLocalStream,
      resetCallState,
      setActiveCallId,
      stopLocalStream,
      userId,
    ],
  );

  const joinExistingCall = useCallback(
    async (mode: CallType, isGroupCall?: boolean, callId?: string | null) => {
      if (!canHandleCall || !conversationId || !userId) return;

      try {
        const effectiveMode: CallType = isGroupCall ? "video" : mode;
        setIsConnecting(true);
        setBusyUserIds([]);
        
        await ensureLocalStream(effectiveMode);

        activeConversationRef.current = conversationId;
        setCallType(effectiveMode);
        isGroupRef.current = !!isGroupCall;
        setIsGroup(!!isGroupCall);
        setIsInCall(true);
        if (callId) {
          setActiveCallId(callId);
        }

        const response = await socketService.joinCall(
          conversationId,
          userId,
          effectiveMode,
          callId || activeCallIdRef.current,
        );

        if (!response?.ok) {
          throw new Error(response?.reason || "join_call_failed");
        }

        if (response?.callId) {
          setActiveCallId(response.callId);
        }
        if (response?.participants) {
          setParticipants(response.participants);
        }
        if (response?.livekitToken) {
          setLivekitToken(response.livekitToken);
        }
        if (effectiveMode === "video") {
          emitLocalCameraState(
            !localStreamRef.current?.getVideoTracks().some(isLiveTrack),
          );
        }
      } catch (error) {
        console.error("Không thể tham gia cuộc gọi:", error);
        resetCallState();
        stopLocalStream();
      } finally {
        setIsConnecting(false);
      }
    },
    [
      canHandleCall,
      conversationId,
      emitLocalCameraState,
      ensureLocalStream,
      resetCallState,
      setActiveCallId,
      stopLocalStream,
      userId,
    ],
  );

  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall || !userId) return;

    try {
      const effectiveMode: CallType = incomingCall.isGroup ? "video" : incomingCall.callType;
      setIsConnecting(true);
      await ensureLocalStream(effectiveMode);

      activeConversationRef.current = incomingCall.conversationId;
      setCallType(effectiveMode);
      isGroupRef.current = !!incomingCall.isGroup;
      setIsGroup(!!incomingCall.isGroup);
      setIsInCall(true);
      setActiveCallId(incomingCall.callId || null);

      const response = await socketService.joinCall(
        incomingCall.conversationId,
        userId,
        effectiveMode,
        incomingCall.callId,
      );

      if (!response?.ok) {
        throw new Error(response?.reason || "accept_call_failed");
      }

      if (response?.callId) {
        setActiveCallId(response.callId);
      }
      if (response?.participants) {
        setParticipants(response.participants);
      }
      if (response?.livekitToken) {
        setLivekitToken(response.livekitToken);
      }
      if (effectiveMode === "video") {
        emitLocalCameraState(
          !localStreamRef.current?.getVideoTracks().some(isLiveTrack),
        );
      }

      setIncomingCall(null);
    } catch (error) {
      console.error("Không thể chấp nhận cuộc gọi:", error);
      setIncomingCall(null);
      resetCallState();
      stopLocalStream();
    } finally {
      setIsConnecting(false);
    }
  }, [
    ensureLocalStream,
    emitLocalCameraState,
    incomingCall,
    resetCallState,
    setActiveCallId,
    stopLocalStream,
    userId,
  ]);

  const declineIncomingCall = useCallback(() => {
    if (!incomingCall || !userId) return;
    if (hasDeclinedIncomingCallRef.current) return;

    hasDeclinedIncomingCallRef.current = true;
    socketService.declineCall(
      incomingCall.conversationId,
      userId,
      incomingCall.callerId,
      incomingCall.callId,
    );
    setIncomingCall(null);
  }, [incomingCall, userId]);

  const endCall = useCallback(async (notifyRemote = true) => {
    const activeConversationId = activeConversationRef.current;
    let endSignalPromise = Promise.resolve(false);

    if (notifyRemote && activeConversationId && userId) {
      if (isGroupRef.current) {
        endSignalPromise = socketService
          .leaveCall(activeConversationId, userId, activeCallIdRef.current)
          .then((response) => response?.ok === true)
          .catch(() => false);
      } else {
        endSignalPromise = emitEndCallOnce(activeConversationId);
      }
    }

    closeCallLocally();
    await endSignalPromise;
  }, [closeCallLocally, emitEndCallOnce, userId]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    if (!isMuted) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      setIsMuted(true);
      return;
    }

    void (async () => {
      const liveAudioTracks = stream.getAudioTracks().filter(isLiveTrack);
      if (liveAudioTracks.length > 0) {
        liveAudioTracks.forEach((track) => {
          track.enabled = true;
        });
        setIsMuted(false);
        return;
      }

      const nextTrack = await acquireAudioTrack();
      if (!nextTrack) {
        setIsMuted(true);
        return;
      }

      stream.getAudioTracks().forEach((track) => {
        stream.removeTrack(track);
        stopTrack(track);
      });
      stream.addTrack(nextTrack);
      replaceOutgoingAudioTrack(nextTrack);
      setIsMuted(false);
    })();
  }, [acquireAudioTrack, isMuted, replaceOutgoingAudioTrack]);

  const toggleCamera = useCallback(() => {
    if (callType !== "video") return;
    if (isScreenSharing) return;

    const stream = localStreamRef.current;
    if (!stream) return;

      if (!isCameraOff) {
        releaseLocalVideoTracks();
        setIsCameraOff(true);
        if (activeConversationRef.current && userId) {
          socketService.emitCameraState(
            activeConversationRef.current,
            userId,
            true,
            activeCallIdRef.current,
          );
        }
        return;
      }

    void (async () => {
      const nextTrack = await acquireVideoTrack();
      if (!nextTrack) {
        setIsCameraOff(true);
        if (activeConversationRef.current && userId) {
          socketService.emitCameraState(
            activeConversationRef.current,
            userId,
            true,
            activeCallIdRef.current,
          );
        }
        return;
      }

      stream.getVideoTracks().forEach((track) => {
        stream.removeTrack(track);
        stopTrack(track);
      });
      stream.addTrack(nextTrack);
      replaceOutgoingVideoTrack(nextTrack);
      setIsCameraOff(false);
      if (activeConversationRef.current && userId) {
        socketService.emitCameraState(
          activeConversationRef.current,
          userId,
          false,
          activeCallIdRef.current,
        );
      }
    })();
  }, [
    acquireVideoTrack,
    callType,
    isCameraOff,
    isScreenSharing,
    releaseLocalVideoTracks,
    replaceOutgoingVideoTrack,
    userId,
  ]);

  const stopScreenShare = useCallback(async () => {
    if (callType !== "video") return;

    const stream = localStreamRef.current;
    const activeScreenTrack = screenTrackRef.current;

    if (!stream || !activeScreenTrack) {
      setIsScreenSharing(false);
      return;
    }

    activeScreenTrack.onended = null;
    stream.removeTrack(activeScreenTrack);
    stopTrack(activeScreenTrack);
    screenTrackRef.current = null;

    let restoreTrack = cameraTrackBeforeShareRef.current;

    if (!restoreTrack || restoreTrack.readyState !== "live") {
      try {
        restoreTrack = await acquireVideoTrack();
      } catch (error) {
        console.error("Khong the khoi phuc camera sau khi dung share:", error);
        restoreTrack = null;
      }
    }

    if (restoreTrack) {
      restoreTrack.enabled = !cameraOffBeforeShareRef.current;
      stream.addTrack(restoreTrack);
      replaceOutgoingVideoTrack(restoreTrack);
      setIsCameraOff(cameraOffBeforeShareRef.current);
    } else {
      replaceOutgoingVideoTrack(null);
      setIsCameraOff(true);
    }

    cameraTrackBeforeShareRef.current = null;
    cameraOffBeforeShareRef.current = false;
    setIsScreenSharing(false);
  }, [acquireVideoTrack, callType, replaceOutgoingVideoTrack]);

  const startScreenShare = useCallback(async () => {
    if (callType !== "video" || isScreenSharing) return;

    const stream = localStreamRef.current;
    if (!stream) return;

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const [screenTrack] = displayStream.getVideoTracks();

      if (!screenTrack) return;

      const currentCameraTrack = stream.getVideoTracks()[0] || null;
      cameraTrackBeforeShareRef.current = currentCameraTrack;
      cameraOffBeforeShareRef.current = isCameraOff;

      if (currentCameraTrack) {
        stream.removeTrack(currentCameraTrack);
      }

      stream.addTrack(screenTrack);
      replaceOutgoingVideoTrack(screenTrack);
      screenTrackRef.current = screenTrack;
      setIsScreenSharing(true);
      setIsCameraOff(false);

      screenTrack.onended = () => {
        void stopScreenShare();
      };
    } catch (error) {
      console.error("Khong the bat dau chia se man hinh:", error);
    }
  }, [
    callType,
    isCameraOff,
    isScreenSharing,
    replaceOutgoingVideoTrack,
    stopScreenShare,
  ]);

  const toggleScreenShare = useCallback(() => {
    if (isScreenSharing) {
      void stopScreenShare();
      return;
    }

    void startScreenShare();
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  useEffect(() => {
    const handleIncomingCall = (payload: IncomingCall) => {
      if (!userId) return;
      if (payload.callerId === userId) return;
      if (isInCall) return;
      setIncomingCall(payload);
    };

    const handleCallJoined = async (payload: {
      conversationId: string;
      callId?: string;
      userId: string;
      participants: string[];
      callType: CallType;
      isGroup?: boolean;
      livekitToken?: string;
    }) => {
      if (!userId || !isPayloadForActiveCall(payload))
        return;

      setParticipants(payload.participants);
      setCallType(payload.callType);
      setIsGroup(!!payload.isGroup);
      if (
        payload.participants.some((id) => String(id) !== String(userId || ""))
      ) {
        markRemoteConnected();
      }
      if (payload.livekitToken && String(payload.userId) === String(userId)) {
        setLivekitToken(payload.livekitToken);
      }

      if (!localStreamRef.current) return;

      // Full-mesh strategy: every existing participant creates a connection to
      // the newly joined participant. This keeps web compatible with mobile.
      if (payload.userId === userId) {
        return;
      }

      if (peerConnectionsRef.current.has(payload.userId)) {
        return;
      }

      try {
        await createOfferFor(payload.userId, payload.callType);
      } catch (error) {
        console.error("Không thể tạo offer:", error);
      }
    };

    const handleOffer = async (payload: {
      conversationId: string;
      callId?: string;
      fromUserId: string;
      offer: RTCSessionDescriptionInit;
      callType: CallType;
    }) => {
      if (
        !isPayloadForActiveCall(payload) ||
        !userId
      ) {
        return;
      }

      try {
        const pc = getOrCreatePeer(payload.fromUserId, payload.callType);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        await flushPendingIceCandidates(payload.fromUserId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketService.sendAnswer(
          payload.conversationId,
          activeCallIdRef.current,
          userId,
          payload.fromUserId,
          answer,
        );
      } catch (error) {
        console.error("Xử lý offer thất bại:", error);
      }
    };

    const handleAnswer = async (payload: {
      conversationId: string;
      callId?: string;
      fromUserId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      if (!isPayloadForActiveCall(payload)) {
        return;
      }

      try {
        const pc = peerConnectionsRef.current.get(payload.fromUserId);
        if (!pc) return;

        await pc.setRemoteDescription(
          new RTCSessionDescription(payload.answer),
        );
        await flushPendingIceCandidates(payload.fromUserId, pc);
      } catch (error) {
        console.error("Xử lý answer thất bại:", error);
      }
    };

    const handleIceCandidate = async (payload: {
      conversationId: string;
      callId?: string;
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (!isPayloadForActiveCall(payload)) {
        return;
      }

      try {
        const pc = peerConnectionsRef.current.get(payload.fromUserId);
        if (!pc || !pc.remoteDescription) {
          queueIceCandidate(payload.fromUserId, payload.candidate);
          return;
        }

        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (error) {
        console.error("Xử lý ICE candidate thất bại:", error);
      }
    };

    const handleCallLeft = (payload: {
      conversationId: string;
      callId?: string;
      userId: string;
      participants: string[];
    }) => {
      if (!isPayloadForActiveCall(payload)) {
        return;
      }

      cleanupPeer(payload.userId);
      setParticipants(payload.participants);
    };

    const handleCallEnded = (payload: {
      conversationId: string;
      callId?: string;
      endedBy?: string | null;
    }) => {
      if (!isPayloadForActiveCall(payload)) {
        return;
      }

      void endCall(false);
    };

    const handleCallDeclined = (payload: {
      conversationId: string;
      callId?: string;
      userId: string;
    }) => {
      if (!isPayloadForActiveCall(payload)) {
        return;
      }

      console.log(`User ${payload.userId} tu choi cuoc goi`);
    };

    const handleCallBusy = (payload: {
      conversationId: string;
      targetUserId: string;
    }) => {
      if (
        !activeConversationRef.current ||
        payload.conversationId !== activeConversationRef.current
      ) {
        return;
      }

      setBusyUserIds((prev) => {
        if (prev.includes(payload.targetUserId)) {
          return prev;
        }
        return [...prev, payload.targetUserId];
      });
    };

    const handleCameraStateChanged = (payload: {
      conversationId: string;
      callId?: string;
      userId: string;
      isCameraOff: boolean;
    }) => {
      if (!isPayloadForActiveCall(payload)) {
        return;
      }
      setRemoteCameraStates((prev) => ({
        ...prev,
        [payload.userId]: payload.isCameraOff,
      }));
    };

    const handleStartCallSuccess = (payload: {
      conversationId: string;
      callId?: string;
      callType: CallType;
      isGroup?: boolean;
      livekitToken?: string;
    }) => {
      if (!isPayloadForActiveCall(payload)) return;
      if (payload.callId) {
        setActiveCallId(payload.callId);
      }
      if (payload.livekitToken) {
        setLivekitToken(payload.livekitToken);
      }
      if (payload.isGroup) {
        isGroupRef.current = true;
        setIsGroup(true);
      }
    };

    socketService.onIncomingCall(handleIncomingCall);
    socketService.onStartCallSuccess(handleStartCallSuccess);
    socketService.onCallJoined(handleCallJoined);
    socketService.onOffer(handleOffer);
    socketService.onAnswer(handleAnswer);
    socketService.onIceCandidate(handleIceCandidate);
    socketService.onCallLeft(handleCallLeft);
    socketService.onCallEnded(handleCallEnded);
    socketService.onCallDeclined(handleCallDeclined);
    socketService.onCallBusy(handleCallBusy);
    socketService.onCameraStateChanged(handleCameraStateChanged);

    return () => {
      socketService.offIncomingCall(handleIncomingCall);
      socketService.offStartCallSuccess(handleStartCallSuccess);
      socketService.offCallJoined(handleCallJoined);
      socketService.offOffer(handleOffer);
      socketService.offAnswer(handleAnswer);
      socketService.offIceCandidate(handleIceCandidate);
      socketService.offCallLeft(handleCallLeft);
      socketService.offCallEnded(handleCallEnded);
      socketService.offCallDeclined(handleCallDeclined);
      socketService.offCallBusy(handleCallBusy);
      socketService.offCameraStateChanged(handleCameraStateChanged);
    };
  }, [
    closeCallLocally,
    cleanupPeer,
    createOfferFor,
    endCall,
    flushPendingIceCandidates,
    getOrCreatePeer,
    isPayloadForActiveCall,
    isInCall,
    markRemoteConnected,
    queueIceCandidate,
    setActiveCallId,
    userId,
  ]);

  useEffect(() => {
    return () => {
      const activeConversationId = activeConversationRef.current;
      const activeUserId = userIdRef.current;

      if (activeConversationId && activeUserId) {
        if (isGroupRef.current) {
          void socketService.leaveCall(
            activeConversationId,
            activeUserId,
            activeCallIdRef.current,
          );
        } else {
          void emitEndCallOnce(activeConversationId);
        }
      }

      cleanupAllPeers();
      stopLocalStream();
    };
  }, [cleanupAllPeers, emitEndCallOnce, stopLocalStream]);

  const localStream = localStreamRef.current;

  return useMemo(
    () => ({
      incomingCall,
      isInCall,
      isConnecting,
      callType,
      busyUserIds,
      localStream,
      remoteStreams,
      participants,
      isMuted,
      isCameraOff,
      isScreenSharing,
      remoteCameraStates,
      isGroup,
      livekitToken,
      currentCallId,
      startCall,
      joinExistingCall,
      acceptIncomingCall,
      declineIncomingCall,
      endCall,
      toggleMic,
      toggleCamera,
      toggleScreenShare,
      stopLocalStream,
    }),
    [
      acceptIncomingCall,
      callType,
      currentCallId,
      declineIncomingCall,
      endCall,
      incomingCall,
      isCameraOff,
      isScreenSharing,
      remoteCameraStates,
      isConnecting,
      isInCall,
      isMuted,
      busyUserIds,
      localStream,
      localStreamRevision,
      participants,
      remoteStreams,
      startCall,
      joinExistingCall,
      toggleCamera,
      toggleMic,
      toggleScreenShare,
      isGroup,
      livekitToken,
      stopLocalStream,
    ],
  );
};
