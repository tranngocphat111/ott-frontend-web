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

    const token = localStorage.getItem("accessToken");
    const socket = io(SOCKET_CHAT_SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token,
      },
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

  onPollUpdate(callback: (payload: any) => void) {
    this.socket?.on("tin_nhan_cap_nhat", callback);
  }

  offPollUpdate(callback?: (payload: any) => void) {
    if (callback) {
      this.socket?.off("tin_nhan_cap_nhat", callback);
    } else {
      this.socket?.removeAllListeners("tin_nhan_cap_nhat");
    }
  }

  onRelationshipUpdate(callback: (relationship: any) => void) {
    this.socket?.on("cap_nhat_quan_he", callback);
  }

  offRelationshipUpdate(callback?: (relationship: any) => void) {
    if (callback) {
      this.socket?.off("cap_nhat_quan_he", callback);
    } else {
      this.socket?.removeAllListeners("cap_nhat_quan_he");
    }
  }

  onMessageDestroyed(callback: (payload: { msg_id: string; conversation_id: string }) => void) {
    this.socket?.on("tin_nhan_da_xoa", callback);
  }

  offMessageDestroyed(callback?: (payload: any) => void) {
    if (callback) {
      this.socket?.off("tin_nhan_da_xoa", callback);
    } else {
      this.socket?.removeAllListeners("tin_nhan_da_xoa");
    }
  }

  onMessageRecalled(callback: (payload: { msg_id: string; conversation_id: string }) => void) {
    this.socket?.on("tin_nhan_thu_hoi", callback);
  }

  offMessageRecalled(callback?: (payload: any) => void) {
    if (callback) {
      this.socket?.off("tin_nhan_thu_hoi", callback);
    } else {
      this.socket?.removeAllListeners("tin_nhan_thu_hoi");
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

  onMemberKicked(callback: (payload: { conversationId: string; userId: string }) => void) {
    this.socket?.on("xoa_thanh_vien", callback);
  }

  offMemberKicked(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("xoa_thanh_vien", callback);
    } else {
      this.socket?.removeAllListeners("xoa_thanh_vien");
    }
  }

  onKickedFromGroup(callback: (payload: { conversationId: string }) => void) {
    this.socket?.on("bi_xoa_khoi_nhom", callback);
  }

  offKickedFromGroup(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("bi_xoa_khoi_nhom", callback);
    } else {
      this.socket?.removeAllListeners("bi_xoa_khoi_nhom");
    }
  }

  onMemberLeft(callback: (payload: { conversationId: string; userId: string }) => void) {
    this.socket?.on("roi_nhom", callback);
  }

  offMemberLeft(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("roi_nhom", callback);
    } else {
      this.socket?.removeAllListeners("roi_nhom");
    }
  }

  onMemberAdded(callback: (payload: any) => void) {
    this.socket?.on("them_nguoi_moi", callback);
  }

  offMemberAdded(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("them_nguoi_moi", callback);
    } else {
      this.socket?.removeAllListeners("them_nguoi_moi");
    }
  }

  startTyping(conversationId: string, userId: string) {
    this.emitWhenConnected("nguoi_dung_dang_soan_tin_nhan", {
      conversationId,
      userId,
    });
  }

  stopTyping(conversationId: string, userId: string) {
    this.emitWhenConnected("nguoi_dung_ngung_soan_tin_nhan", {
      conversationId,
      userId,
    });
  }

  onTyping(
    callback: (payload: { conversationId: string; userId: string }) => void,
  ) {
    this.socket?.on("nguoi_dung_dang_soan_tin_nhan", callback);
  }

  offTyping(
    callback?: (payload: { conversationId: string; userId: string }) => void,
  ) {
    if (callback) {
      this.socket?.off("nguoi_dung_dang_soan_tin_nhan", callback);
    } else {
      this.socket?.removeAllListeners("nguoi_dung_dang_soan_tin_nhan");
    }
  }

  onTypingStopped(
    callback: (payload: { conversationId: string; userId: string }) => void,
  ) {
    this.socket?.on("nguoi_dung_ngung_soan_tin_nhan", callback);
  }

  offTypingStopped(
    callback?: (payload: { conversationId: string; userId: string }) => void,
  ) {
    if (callback) {
      this.socket?.off("nguoi_dung_ngung_soan_tin_nhan", callback);
    } else {
      this.socket?.removeAllListeners("nguoi_dung_ngung_soan_tin_nhan");
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

  /** Kiểm tra người nhận có đang bận không TRƯỚC khi mở cửa sổ gọi */
  checkCallAvailability(conversationId: string, callerId: string) {
    this.emitWhenConnected("kiem_tra_ban_goi", { conversationId, callerId });
  }

  /** Server trả về: người nhận sẵn sàng → an toàn để mở cửa sổ gọi */
  onCallReady(callback: (payload: { conversationId: string }) => void) {
    this.socket?.on("san_sang_de_goi", callback);
  }

  offCallReady(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("san_sang_de_goi", callback);
    } else {
      this.socket?.removeAllListeners("san_sang_de_goi");
    }
  }

  emitCameraState(conversationId: string, userId: string, isCameraOff: boolean) {
    this.emitWhenConnected("trang_thai_camera", {
      conversationId,
      userId,
      isCameraOff,
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

  onCallBusy(
    callback: (payload: {
      conversationId: string;
      targetUserId: string;
    }) => void,
  ) {
    this.socket?.on("nguoi_dung_ban_goi", callback);
  }

  offCallBusy(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("nguoi_dung_ban_goi", callback);
    } else {
      this.socket?.removeAllListeners("nguoi_dung_ban_goi");
    }
  }

  onCameraStateChanged(
    callback: (payload: {
      conversationId: string;
      userId: string;
      isCameraOff: boolean;
    }) => void,
  ) {
    this.socket?.on("thay_doi_trang_thai_camera", callback);
  }

  offCameraStateChanged(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("thay_doi_trang_thai_camera", callback);
    } else {
      this.socket?.removeAllListeners("thay_doi_trang_thai_camera");
    }
  }

  /** Read Status Synchronization */
  onReadStatus(
    callback: (payload: {
      conversationId: string;
      userId: string;
      msgId: string;
      readAt: string;
    }) => void,
  ) {
    this.socket?.on("tin_nhan_doc", callback);
  }

  offReadStatus(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("tin_nhan_doc", callback);
    } else {
      this.socket?.removeAllListeners("tin_nhan_doc");
    }
  }
}

console.log("🚀 SocketService V2.0.1 Loaded");
export const socketService = new SocketService();
