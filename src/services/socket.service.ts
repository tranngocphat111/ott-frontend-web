import { io, Socket } from "socket.io-client";
import { SOCKET_CHAT_SERVER_URL, SOCKET_CHAT_TRANSPORTS } from "../config/api.config";

type CallType = "voice" | "video";

type CallSessionAck = {
  ok?: boolean;
  reason?: string;
  conversationId?: string;
  callId?: string;
  callType?: CallType;
  isGroup?: boolean;
  livekitToken?: string | null;
  participants?: string[];
  participantDetails?: Array<{
    userId?: string;
    user_id?: string;
    id?: string;
    name?: string;
    avatar?: string;
  }>;
  targetUserId?: string;
};

class SocketService {
  private socket: Socket | null = null;
  private userRoomId: string | null = null;
  private joinedUserRoomKey: string | null = null;
  private joinedConversationIds = new Set<string>();

  private ensureSocket(): Socket {
    return this.socket ?? this.connect();
  }

  public emit(event: string, payload: unknown) {
    this.emitWhenConnected(event, payload);
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

  private emitWithAck<T = unknown>(
    event: string,
    payload: unknown,
    timeoutMs = 1000,
  ): Promise<T | null> {
    const socket = this.ensureSocket();

    return new Promise((resolve) => {
      let settled = false;

      const finish = (value: T | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const emit = () => {
        try {
          socket.timeout(timeoutMs).emit(
            event,
            payload,
            (error: Error | null, response: T) => {
              if (error) {
                finish(null);
                return;
              }

              finish(response ?? null);
            },
          );
        } catch {
          socket.emit(event, payload);
          window.setTimeout(() => finish(null), 100);
        }
      };

      if (socket.connected) {
        emit();
        return;
      }

      const timeoutId = window.setTimeout(() => finish(null), timeoutMs);
      socket.once("connect", () => {
        window.clearTimeout(timeoutId);
        emit();
      });
    });
  }

  connect(): Socket {
    if (this.socket) {
      if (!this.socket.connected && this.socket.disconnected) {
        this.socket.connect();
      }
      return this.socket;
    }

    const token = localStorage.getItem("accessToken");
    const socket = io(SOCKET_CHAT_SERVER_URL, {
      transports: SOCKET_CHAT_TRANSPORTS,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token,
      },
    });

    socket.on("connect", () => {
      console.log("Socket connection:", socket.id);
      this.joinedUserRoomKey = null;

      if (this.userRoomId) {
        this.emitJoinUserRoom(socket, this.userRoomId);
      }

      this.joinedConversationIds.forEach((conversationId) => {
        socket.emit("tham_gia_nhom", conversationId);
      });
    });
    socket.on("disconnect", () => {
      this.joinedUserRoomKey = null;
      console.log("Socket disconnected");
    });
    socket.on("connect_error", (err) =>
      console.error("Socket Error:", err.message),
    );

    return (this.socket = socket);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.userRoomId = null;
    this.joinedUserRoomKey = null;
    this.joinedConversationIds.clear();
    console.log("Socket disconnected manually");
  }

  private emitJoinUserRoom(socket: Socket, userId: string) {
    const joinKey = `${socket.id || "pending"}:${userId}`;
    if (this.joinedUserRoomKey === joinKey) return;

    socket.emit("tham_gia_user_room", userId);
    this.joinedUserRoomKey = joinKey;
    console.log(`Đã vào user room: user:${userId}`);
  }

  joinUserRoom(userId: string) {
    const socket = this.ensureSocket();
    this.userRoomId = userId;

    if (socket.connected) {
      this.emitJoinUserRoom(socket, userId);
    }
  }

  refreshPresence(userId?: string) {
    const activeUserId = userId || this.userRoomId;
    if (!activeUserId) return;

    this.userRoomId = activeUserId;
    this.emitWhenConnected("presence_heartbeat", { userId: activeUserId });
  }

  joinConversation(conversationId: string) {
    const socket = this.ensureSocket();
    this.joinedConversationIds.add(conversationId);

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

  onGroupCallUpdated(callback: (payload: any) => void) {
    this.socket?.on("cap_nhat_trang_thai_goi_nhom", callback);
  }

  offGroupCallUpdated(callback?: (payload: any) => void) {
    if (callback) {
      this.socket?.off("cap_nhat_trang_thai_goi_nhom", callback);
    } else {
      this.socket?.removeAllListeners("cap_nhat_trang_thai_goi_nhom");
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
    this.ensureSocket().on("cap_nhat_quan_he", callback);
  }

  offRelationshipUpdate(callback?: (relationship: any) => void) {
    if (callback) {
      this.socket?.off("cap_nhat_quan_he", callback);
    } else {
      this.socket?.removeAllListeners("cap_nhat_quan_he");
    }
  }

  onForceLogout(callback: (payload: { action: string; deviceId?: string; revokedDeviceIds?: string[] }) => void) {
    this.socket?.on("buoc_dang_xuat", callback);
  }

  offForceLogout(callback?: (payload: any) => void) {
    if (callback) {
      this.socket?.off("buoc_dang_xuat", callback);
    } else {
      this.socket?.removeAllListeners("buoc_dang_xuat");
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

  onMemberNicknameUpdated(callback: (payload: {
    conversationId?: string;
    conversation_id?: string;
    userId?: string;
    user_id?: string;
    nickname?: string;
  }) => void) {
    this.ensureSocket().on("cap_nhat_biet_danh", callback);
  }

  offMemberNicknameUpdated(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("cap_nhat_biet_danh", callback);
    } else {
      this.socket?.removeAllListeners("cap_nhat_biet_danh");
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

  markMessageDelivered(
    conversationId: string,
    userId: string,
    msgId: string,
    deviceId?: string,
  ) {
    this.emitWhenConnected("message_delivered", {
      conversationId,
      userId,
      msgId,
      deviceId,
    });
  }

  markMessagesDeliveredUpTo(
    conversationId: string,
    userId: string,
    msgId: string,
    deviceId?: string,
  ) {
    this.emitWhenConnected("messages_delivered_up_to", {
      conversationId,
      userId,
      msgId,
      deviceId,
    });
  }

  markMessageSeenUpTo(
    conversationId: string,
    userId: string,
    msgId: string,
    deviceId?: string,
  ) {
    this.emitWhenConnected("message_seen_up_to", {
      conversationId,
      userId,
      msgId,
      deviceId,
    });
  }

  onTyping(
    callback: (payload: { conversationId: string; userId: string }) => void,
  ) {
    this.ensureSocket().on("nguoi_dung_dang_soan_tin_nhan", callback);
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
    this.ensureSocket().on("nguoi_dung_ngung_soan_tin_nhan", callback);
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

  startCall(
    conversationId: string,
    callerId: string,
    callType: CallType,
    invitedUserIds?: string[],
  ): Promise<CallSessionAck | null> {
    return this.emitWithAck<CallSessionAck>("bat_dau_goi", {
      conversationId,
      callerId,
      callType,
      invitedUserIds,
    }, 3000);
  }

  joinCall(
    conversationId: string,
    userId: string,
    callType: CallType,
    callId?: string | null,
  ): Promise<CallSessionAck | null> {
    return this.emitWithAck<CallSessionAck>("tham_gia_cuoc_goi", {
      conversationId,
      callId,
      userId,
      callType,
    }, 3000);
  }

  leaveCall(conversationId: string, userId: string, callId?: string | null) {
    return this.emitWithAck<CallSessionAck>("roi_cuoc_goi", {
      conversationId,
      callId,
      userId,
    }, 1500);
  }

  leaveAllCallsForLogout(userId: string) {
    return this.emitWithAck<{ ok?: boolean }>("dang_xuat", { userId }, 1200);
  }

  inviteGroupCallMembers(
    conversationId: string,
    callId: string | null | undefined,
    callerId: string,
    targetUserIds: string[],
  ) {
    this.emitWhenConnected("moi_them_thanh_vien_goi", {
      conversationId,
      callId,
      callerId,
      targetUserIds,
    });
  }

  async endCall(
    conversationId: string,
    userId: string,
    metadata?: {
      callId?: string | null;
      callType?: CallType;
      wasConnected?: boolean;
      durationSeconds?: number;
    },
  ): Promise<boolean> {
    const response = await this.emitWithAck<{ ok?: boolean }>(
      "ket_thuc_goi",
      {
        conversationId,
        userId,
        ...(metadata || {}),
      },
      3000,
    );
    return response?.ok === true;
  }

  declineCall(
    conversationId: string,
    userId: string,
    callerId: string,
    callId?: string | null,
  ) {
    this.emitWhenConnected("tu_choi_goi", {
      conversationId,
      callId,
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

  emitCameraState(
    conversationId: string,
    userId: string,
    isCameraOff: boolean,
    callId?: string | null,
  ) {
    this.emitWhenConnected("trang_thai_camera", {
      conversationId,
      callId,
      userId,
      isCameraOff,
    });
  }

  sendOffer(
    conversationId: string,
    callId: string | null | undefined,
    fromUserId: string,
    targetUserId: string,
    offer: RTCSessionDescriptionInit,
    callType: CallType,
  ) {
    this.emitWhenConnected("gui_offer", {
      conversationId,
      callId,
      fromUserId,
      targetUserId,
      offer,
      callType,
    });
  }

  sendAnswer(
    conversationId: string,
    callId: string | null | undefined,
    fromUserId: string,
    targetUserId: string,
    answer: RTCSessionDescriptionInit,
  ) {
    this.emitWhenConnected("gui_answer", {
      conversationId,
      callId,
      fromUserId,
      targetUserId,
      answer,
    });
  }

  sendIceCandidate(
    conversationId: string,
    callId: string | null | undefined,
    fromUserId: string,
    targetUserId: string,
    candidate: RTCIceCandidateInit,
  ) {
    this.emitWhenConnected("gui_ice_candidate", {
      conversationId,
      callId,
      fromUserId,
      targetUserId,
      candidate,
    });
  }

  onStartCallSuccess(
    callback: (payload: {
      conversationId: string;
      callId?: string;
      callType: CallType;
      isGroup?: boolean;
      livekitToken?: string;
    }) => void,
  ) {
    this.socket?.on("bat_dau_goi_thanh_cong", callback);
  }

  offStartCallSuccess(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("bat_dau_goi_thanh_cong", callback);
    } else {
      this.socket?.removeAllListeners("bat_dau_goi_thanh_cong");
    }
  }

  onIncomingCall(
    callback: (payload: {
      conversationId: string;
      callId?: string;
      callerId: string;
      callType: CallType;
      startedAt?: string;
      isGroup?: boolean;
      livekitToken?: string;
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
      callId?: string;
      userId: string;
      participants: string[];
      callType: CallType;
      isGroup?: boolean;
      livekitToken?: string;
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
      callId?: string;
      userId: string;
      participants: string[];
      reason?: string;
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
      callId?: string;
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
      callId?: string;
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
      callId?: string;
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
      callId?: string;
      endedBy?: string | null;
      reason?: string;
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
    callback: (payload: { conversationId: string; callId?: string; userId: string }) => void,
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
      callId?: string;
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

  onMessageStatusChanged(
    callback: (payload: {
      conversationId: string;
      msgId: string;
      status: "sent" | "delivered" | "seen";
      deliveredCount: number;
      seenCount: number;
      recipientCount: number;
      participant?: any;
      userId?: string;
      changedUserId?: string;
    }) => void,
  ) {
    this.socket?.on("message_status_changed", callback);
  }

  offMessageStatusChanged(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("message_status_changed", callback);
    } else {
      this.socket?.removeAllListeners("message_status_changed");
    }
  }

  onParticipantCursorChanged(
    callback: (payload: {
      conversationId: string;
      userId: string;
      msgId: string;
      receiptType: "delivered" | "seen";
      participant?: any;
    }) => void,
  ) {
    this.socket?.on("participant_cursor_changed", callback);
  }

  offParticipantCursorChanged(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("participant_cursor_changed", callback);
    } else {
      this.socket?.removeAllListeners("participant_cursor_changed");
    }
  }

  onConversationReadSynced(
    callback: (payload: {
      conversationId: string;
      userId: string;
      msgId: string;
      participant?: any;
    }) => void,
  ) {
    this.socket?.on("conversation_read_synced", callback);
  }

  offConversationReadSynced(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("conversation_read_synced", callback);
    } else {
      this.socket?.removeAllListeners("conversation_read_synced");
    }
  }

  /** User Info Synchronization */
  onUserInfoUpdated(
    callback: (payload: {
      userId: string;
      fullName?: string;
      avatarUrl?: string;
      coverUrl?: string;
      bio?: string;
    }) => void,
  ) {
    this.socket?.on("cap_nhat_thong_tin_ca_nhan", callback);
  }

  offUserInfoUpdated(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("cap_nhat_thong_tin_ca_nhan", callback);
    } else {
      this.socket?.removeAllListeners("cap_nhat_thong_tin_ca_nhan");
    }
  }

  // ── PRESENCE (User Online/Offline Status) ────────────────────────────────

  /**
   * Hỏi server trạng thái online của danh sách userId.
   * Server sẽ trả về event "ket_qua_trang_thai_hoat_dong".
   */
  queryPresence(userIds: string[]) {
    this.emitWhenConnected("hoi_trang_thai_hoat_dong", { userIds });
  }

  /**
   * Nhận kết quả batch query presence từ server.
   */
  onPresenceResult(callback: (result: { userId: string; isOnline: boolean }[]) => void) {
    this.socket?.on("ket_qua_trang_thai_hoat_dong", callback);
  }

  offPresenceResult(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("ket_qua_trang_thai_hoat_dong", callback);
    } else {
      this.socket?.removeAllListeners("ket_qua_trang_thai_hoat_dong");
    }
  }

  /**
   * Lắng nghe sự kiện thay đổi trạng thái hoạt động real-time.
   * Event: "trang_thai_hoat_dong" từ server.
   */
  onPresenceChanged(
    callback: (payload: {
      userId: string;
      isOnline: boolean;
      lastSeenAt: string | null;
    }) => void
  ) {
    this.socket?.on("trang_thai_hoat_dong", callback);
  }

  offPresenceChanged(callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off("trang_thai_hoat_dong", callback);
    } else {
      this.socket?.removeAllListeners("trang_thai_hoat_dong");
    }
  }

  // ── IN-APP NOTIFICATIONS ────────────────────────────────
  onNewNotification(callback: (notification: any) => void) {
    this.socket?.on("thong_bao_moi", callback);
  }

  offNewNotification(callback?: (notification: any) => void) {
    if (callback) {
      this.socket?.off("thong_bao_moi", callback);
    } else {
      this.socket?.removeAllListeners("thong_bao_moi");
    }
  }
}

export const socketService = new SocketService();
console.log("🚀 SocketService V2.0.1 Loaded");
