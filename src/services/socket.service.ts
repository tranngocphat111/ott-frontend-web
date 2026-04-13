import { io, Socket } from "socket.io-client";
import { SOCKET_CHAT_SERVER_URL } from "../config/api.config";

type CallType = "voice" | "video";


class SocketService {
  private socket: Socket | null = null;

  private ensureSocket(): Socket {
    return this.socket ?? this.connect();
  }

  private emitWhenConnected(event: string, payload: unknown) {
    const socket = this.ensureSocket();

    const emit = () => socket.emit(event, payload);

    if (socket.connected) {
      emit();
    } else {
      socket.once("connect", emit);
    }
  }

  connect(): Socket {
    if (this.socket) return this.socket;

    const socket = io(SOCKET_CHAT_SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => console.log("Socket connection:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
    socket.on("connect_error", (err) =>
      console.error("Socket Error:", err.message),
    );

    return (this.socket = socket);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    console.log("Socket disconnected manually");
  }

  joinUserRoom(userId: string) {
    const socket = this.ensureSocket();

    const join = () => {
      socket.emit("tham_gia_user_room", userId);
      console.log(`Đã vào user room: user:${userId}`);
    };

    if (socket.connected) {
      join();
    } else {
      socket.once("connect", join);
    }
  }

  joinConversation(conversationId: string) {
    const socket = this.ensureSocket();

    const join = () => {
      socket.emit("tham_gia_nhom", conversationId);
      console.log(`Đã vào phòng: ${conversationId}`);
    };

    if (socket.connected) {
      join();
    } else {
      console.warn("Đang đợi kết nối để vào phòng...");
      socket.once("connect", join);
    }
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on("tin_nhan", callback);
  }

  offNewMessage(callback?: (message: any) => void) {
    if (callback) {
      this.socket?.off("tin_nhan", callback);
    } else {
      this.socket?.removeAllListeners("tin_nhan");
    }
  }

  onMessageReaction(callback: (payload: any) => void) {
    this.socket?.on("tin_nhan_reaction", callback);
  }

  offMessageReaction(callback?: (payload: any) => void) {
    if (callback) {
      this.socket?.off("tin_nhan_reaction", callback);
    } else {
      this.socket?.removeAllListeners("tin_nhan_reaction");
    }
  }

  onNewConversation(callback: (conversation: any) => void) {
    this.socket?.on("tao_phong_moi", callback);
  }

  offNewConversation(callback?: (conversation: any) => void) {
    if (callback) {
      this.socket?.off("tao_phong_moi", callback);
    } else {
      this.socket?.removeAllListeners("tao_phong_moi");
    }
  }

  onGroupDissolved(callback: (payload: { conversationId: string }) => void) {
    this.socket?.on("giai_tan_nhom", callback);
  }

  offGroupDissolved(callback?: (payload: { conversationId: string }) => void) {
    if (callback) {
      this.socket?.off("giai_tan_nhom", callback);
    } else {
      this.socket?.removeAllListeners("giai_tan_nhom");
    }
  }


  getSocket(): Socket | null {
    return this.socket;
  }

  startCall(conversationId: string, callerId: string, callType: CallType) {
    this.emitWhenConnected("bat_dau_goi", {
      conversationId,
      callerId,
      callType,
    });
  }

  joinCall(conversationId: string, userId: string, callType: CallType) {
    this.emitWhenConnected("tham_gia_cuoc_goi", {
      conversationId,
      userId,
      callType,
    });
  }

  leaveCall(conversationId: string, userId: string) {
    this.emitWhenConnected("roi_cuoc_goi", { conversationId, userId });
  }

  endCall(conversationId: string, userId: string) {
    this.emitWhenConnected("ket_thuc_goi", { conversationId, userId });
  }

  declineCall(conversationId: string, userId: string, callerId: string) {
    this.emitWhenConnected("tu_choi_goi", {
      conversationId,
      userId,
      callerId,
    });
  }

  sendOffer(
    conversationId: string,
    fromUserId: string,
    targetUserId: string,
    offer: RTCSessionDescriptionInit,
    callType: CallType,
  ) {
    this.emitWhenConnected("gui_offer", {
      conversationId,
      fromUserId,
      targetUserId,
      offer,
      callType,
    });
  }

  sendAnswer(
    conversationId: string,
    fromUserId: string,
    targetUserId: string,
    answer: RTCSessionDescriptionInit,
  ) {
    this.emitWhenConnected("gui_answer", {
      conversationId,
      fromUserId,
      targetUserId,
      answer,
    });
  }

  sendIceCandidate(
    conversationId: string,
    fromUserId: string,
    targetUserId: string,
    candidate: RTCIceCandidateInit,
  ) {
    this.emitWhenConnected("gui_ice_candidate", {
      conversationId,
      fromUserId,
      targetUserId,
      candidate,
    });
  }

  onIncomingCall(
    callback: (payload: {
      conversationId: string;
      callerId: string;
      callType: CallType;
      startedAt?: string;
    }) => void,
  ) {
    this.socket?.on("cuoc_goi_den", callback);
  }

  offIncomingCall(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("cuoc_goi_den", callback);
    } else {
      this.socket?.removeAllListeners("cuoc_goi_den");
    }
  }

  onCallJoined(
    callback: (payload: {
      conversationId: string;
      userId: string;
      participants: string[];
      callType: CallType;
    }) => void,
  ) {
    this.socket?.on("nguoi_dung_tham_gia_goi", callback);
  }

  offCallJoined(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("nguoi_dung_tham_gia_goi", callback);
    } else {
      this.socket?.removeAllListeners("nguoi_dung_tham_gia_goi");
    }
  }

  onCallLeft(
    callback: (payload: {
      conversationId: string;
      userId: string;
      participants: string[];
    }) => void,
  ) {
    this.socket?.on("nguoi_dung_roi_goi", callback);
  }

  offCallLeft(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("nguoi_dung_roi_goi", callback);
    } else {
      this.socket?.removeAllListeners("nguoi_dung_roi_goi");
    }
  }

  onOffer(
    callback: (payload: {
      conversationId: string;
      fromUserId: string;
      offer: RTCSessionDescriptionInit;
      callType: CallType;
    }) => void,
  ) {
    this.socket?.on("nhan_offer", callback);
  }

  offOffer(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("nhan_offer", callback);
    } else {
      this.socket?.removeAllListeners("nhan_offer");
    }
  }

  onAnswer(
    callback: (payload: {
      conversationId: string;
      fromUserId: string;
      answer: RTCSessionDescriptionInit;
    }) => void,
  ) {
    this.socket?.on("nhan_answer", callback);
  }

  offAnswer(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("nhan_answer", callback);
    } else {
      this.socket?.removeAllListeners("nhan_answer");
    }
  }

  onIceCandidate(
    callback: (payload: {
      conversationId: string;
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => void,
  ) {
    this.socket?.on("nhan_ice_candidate", callback);
  }

  offIceCandidate(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("nhan_ice_candidate", callback);
    } else {
      this.socket?.removeAllListeners("nhan_ice_candidate");
    }
  }

  onCallEnded(
    callback: (payload: {
      conversationId: string;
      endedBy?: string | null;
    }) => void,
  ) {
    this.socket?.on("ket_thuc_phong_goi", callback);
  }

  offCallEnded(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("ket_thuc_phong_goi", callback);
    } else {
      this.socket?.removeAllListeners("ket_thuc_phong_goi");
    }
  }

  onCallDeclined(
    callback: (payload: { conversationId: string; userId: string }) => void,
  ) {
    this.socket?.on("nguoi_dung_tu_choi_goi", callback);
  }

  offCallDeclined(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("nguoi_dung_tu_choi_goi", callback);
    } else {
      this.socket?.removeAllListeners("nguoi_dung_tu_choi_goi");
    }
  }
}

export const socketService = new SocketService();
