import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socketService } from "../services";

export type CallType = "voice" | "video";

interface IncomingCall {
  conversationId: string;
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

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteMediaStreamRef = useRef<Map<string, MediaStream>>(new Map());
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );
  const activeConversationRef = useRef<string | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackBeforeShareRef = useRef<MediaStreamTrack | null>(null);
  const cameraOffBeforeShareRef = useRef(false);

  const canHandleCall = Boolean(conversationId && userId);

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
    setLivekitToken(null);
    remoteMediaStreamRef.current.clear();
    pendingIceCandidatesRef.current.clear();
    activeConversationRef.current = null;
    screenTrackRef.current = null;
    cameraTrackBeforeShareRef.current = null;
    cameraOffBeforeShareRef.current = false;
  }, []);

  const stopLocalStream = useCallback(() => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }, []);

  const cleanupPeer = useCallback((targetUserId: string) => {
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
  }, []);

  const cleanupAllPeers = useCallback(() => {
    Array.from(peerConnectionsRef.current.keys()).forEach((targetUserId) => {
      cleanupPeer(targetUserId);
    });
  }, [cleanupPeer]);

  const createFakeStream = useCallback((name: string, mode: CallType): MediaStream => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Vẽ nền gradient tối
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
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
      ctx.fillText("(Camera Simulation)", canvas.width / 2, canvas.height / 2 + 50);

      // Animation đơn giản
      let offset = 0;
      const animate = () => {
        if (mode === "video") {
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 40px sans-serif";
          ctx.fillText(name || "User", canvas.width / 2, canvas.height / 2 + Math.sin(offset) * 10);
          ctx.font = "20px sans-serif";
          ctx.fillText("(Camera Simulation)", canvas.width / 2, canvas.height / 2 + 50);
          offset += 0.1;
          requestAnimationFrame(animate);
        }
      };
      if (mode === "video") requestAnimationFrame(animate);
    }

    const stream = canvas.captureStream(30);
    
    // Tạo silent audio track
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const dst = oscillator.connect(audioCtx.createMediaStreamDestination()) as any;
    oscillator.start();
    const silentAudioTrack = dst.stream.getAudioTracks()[0];
    
    if (mode === "voice") {
      return new MediaStream([silentAudioTrack]);
    }
    
    return new MediaStream([stream.getVideoTracks()[0], silentAudioTrack]);
  }, []);

  const ensureLocalStream = useCallback(async (mode: CallType) => {
    const existing = localStreamRef.current;
    if (existing) {
      const hasVideoTrack = existing
        .getVideoTracks()
        .some((track) => track.readyState === "live");
      if (mode === "voice" || hasVideoTrack) {
        return existing;
      }

      existing.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video",
      });

      localStreamRef.current = stream;
      setIsMuted(false);
      setIsCameraOff(mode === "voice");
      return stream;
    } catch (error) {
      console.warn("Không thể truy cập camera/mic thật, sử dụng luồng giả lập để tránh ngắt cuộc gọi:", error);
      // Fallback sang luồng giả lập
      const fakeStream = createFakeStream(userId || "User", mode);
      localStreamRef.current = fakeStream;
      setIsMuted(false);
      setIsCameraOff(mode === "voice");
      return fakeStream;
    }
  }, [createFakeStream, userId]);

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
          userId,
          targetUserId,
          event.candidate.toJSON(),
        );
      };

      pc.ontrack = (event) => {
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
        if (["failed", "closed"].includes(pc.connectionState)) {
          cleanupPeer(targetUserId);
        }
      };

      peerConnectionsRef.current.set(targetUserId, pc);
      setCallType(mode);
      return pc;
    },
    [cleanupPeer, userId],
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
        const sender = pc
          .getSenders()
          .find((item) => item.track?.kind === "video" || item.track === null);

        if (sender && typeof sender.replaceTrack === "function") {
          sender.replaceTrack(nextTrack).catch((error) => {
            console.error("Khong the cap nhat video track:", error);
          });
        }
      });
    },
    [],
  );

  const startCall = useCallback(
    async (mode: CallType, invitedUserIds?: string[]) => {
      if (!canHandleCall || !conversationId || !userId) return;

      try {
        setIsConnecting(true);
        setBusyUserIds([]);
        await ensureLocalStream(mode);

        activeConversationRef.current = conversationId;
        setCallType(mode);
        setIsInCall(true);

        socketService.joinCall(conversationId, userId, mode);
        socketService.startCall(conversationId, userId, mode, invitedUserIds);
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
      ensureLocalStream,
      resetCallState,
      stopLocalStream,
      userId,
    ],
  );

  const joinExistingCall = useCallback(
    async (mode: CallType) => {
      if (!canHandleCall || !conversationId || !userId) return;

      try {
        setIsConnecting(true);
        setBusyUserIds([]);
        await ensureLocalStream(mode);

        activeConversationRef.current = conversationId;
        setCallType(mode);
        setIsInCall(true);

        socketService.joinCall(conversationId, userId, mode);
      } catch (error) {
        console.error("Khong the tham gia cuoc goi:", error);
        resetCallState();
        stopLocalStream();
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [
      canHandleCall,
      conversationId,
      ensureLocalStream,
      resetCallState,
      stopLocalStream,
      userId,
    ],
  );

  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall || !userId) return;

    try {
      setIsConnecting(true);
      await ensureLocalStream(incomingCall.callType);

      activeConversationRef.current = incomingCall.conversationId;
      setCallType(incomingCall.callType);
      setIsGroup(!!incomingCall.isGroup);
      setIsInCall(true);

      socketService.joinCall(
        incomingCall.conversationId,
        userId,
        incomingCall.callType,
      );

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
    incomingCall,
    resetCallState,
    stopLocalStream,
    userId,
  ]);

  const declineIncomingCall = useCallback(() => {
    if (!incomingCall || !userId) return;

    socketService.declineCall(
      incomingCall.conversationId,
      userId,
      incomingCall.callerId,
    );
    setIncomingCall(null);
  }, [incomingCall, userId]);

  const endCall = useCallback(() => {
    const activeConversationId = activeConversationRef.current;
    if (activeConversationId && userId) {
      socketService.endCall(activeConversationId, userId);
      socketService.leaveCall(activeConversationId, userId);
    }

    cleanupAllPeers();

    const currentScreenTrack = screenTrackRef.current;
    if (currentScreenTrack) {
      currentScreenTrack.onended = null;
      currentScreenTrack.stop();
      screenTrackRef.current = null;
    }

    stopLocalStream();
    resetCallState();
  }, [cleanupAllPeers, resetCallState, stopLocalStream, userId]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsMuted((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(() => {
    if (callType !== "video") return;
    if (isScreenSharing) return;

    const stream = localStreamRef.current;
    if (!stream) return;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsCameraOff((prev) => {
      const nextState = !prev;
      if (activeConversationRef.current && userId) {
        socketService.emitCameraState(activeConversationRef.current, userId, nextState);
      }
      return nextState;
    });
  }, [callType, isScreenSharing, userId]);

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
    activeScreenTrack.stop();
    screenTrackRef.current = null;

    let restoreTrack = cameraTrackBeforeShareRef.current;

    if (!restoreTrack || restoreTrack.readyState !== "live") {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        [restoreTrack] = media.getVideoTracks();
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
  }, [callType, replaceOutgoingVideoTrack]);

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
      userId: string;
      participants: string[];
      callType: CallType;
      isGroup?: boolean;
      livekitToken?: string;
    }) => {
      if (!userId || payload.conversationId !== activeConversationRef.current)
        return;

      setParticipants(payload.participants);
      setCallType(payload.callType);
      setIsGroup(!!payload.isGroup);
      if (payload.livekitToken) {
        setLivekitToken(payload.livekitToken);
      }

      if (payload.isGroup) {
        // SFU mode: do not create peer connections
        return;
      }

      if (!localStreamRef.current) return;

      // Full-mesh strategy for group call: every existing participant creates
      // a connection to the newly joined participant.
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
      fromUserId: string;
      offer: RTCSessionDescriptionInit;
      callType: CallType;
    }) => {
      if (
        !activeConversationRef.current ||
        payload.conversationId !== activeConversationRef.current ||
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
      fromUserId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      if (
        !activeConversationRef.current ||
        payload.conversationId !== activeConversationRef.current
      ) {
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
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (
        !activeConversationRef.current ||
        payload.conversationId !== activeConversationRef.current
      ) {
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
      userId: string;
      participants: string[];
    }) => {
      if (
        !activeConversationRef.current ||
        payload.conversationId !== activeConversationRef.current
      ) {
        return;
      }

      cleanupPeer(payload.userId);
      setParticipants(payload.participants);
    };

    const handleCallEnded = (payload: {
      conversationId: string;
      endedBy?: string | null;
    }) => {
      if (
        !activeConversationRef.current ||
        payload.conversationId !== activeConversationRef.current
      ) {
        return;
      }

      cleanupAllPeers();
      stopLocalStream();
      resetCallState();
      setIncomingCall(null);
    };

    const handleCallDeclined = (payload: {
      conversationId: string;
      userId: string;
    }) => {
      if (
        !activeConversationRef.current ||
        payload.conversationId !== activeConversationRef.current
      ) {
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
      userId: string;
      isCameraOff: boolean;
    }) => {
      if (
        !activeConversationRef.current ||
        payload.conversationId !== activeConversationRef.current
      ) {
        return;
      }
      setRemoteCameraStates((prev) => ({
        ...prev,
        [payload.userId]: payload.isCameraOff,
      }));
    };

    socketService.onIncomingCall(handleIncomingCall);
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
    cleanupAllPeers,
    cleanupPeer,
    createOfferFor,
    flushPendingIceCandidates,
    getOrCreatePeer,
    queueIceCandidate,
    resetCallState,
    stopLocalStream,
    userId,
  ]);

  useEffect(() => {
    return () => {
      const activeConversationId = activeConversationRef.current;
      if (activeConversationId && userId) {
        socketService.leaveCall(activeConversationId, userId);
      }

      cleanupAllPeers();
      stopLocalStream();
    };
  }, [cleanupAllPeers, stopLocalStream, userId]);

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
      startCall,
      joinExistingCall,
      acceptIncomingCall,
      declineIncomingCall,
      endCall,
      toggleMic,
      toggleCamera,
      toggleScreenShare,
    }),
    [
      acceptIncomingCall,
      callType,
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
      participants,
      remoteStreams,
      startCall,
      joinExistingCall,
      toggleCamera,
      toggleMic,
      toggleScreenShare,
      isGroup,
      livekitToken,
    ],
  );
};
