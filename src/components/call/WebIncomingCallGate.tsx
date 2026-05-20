import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Phone, PhoneCall, PhoneOff, Video, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useConversations } from "../../contexts/ConversationsContext";
import { socketService } from "../../services";
import {
  getCallOpenBlockReason,
  getConversationDisplayAvatar,
  getConversationDisplayName,
  getFullUrl,
} from "../../utils";

type IncomingCallPayload = {
  conversationId: string;
  callId?: string;
  callerId: string;
  callType: "voice" | "video";
  isGroup?: boolean;
};

type CallOutcomeMessagePayload = {
  type?: string;
  conversation_id?: string;
  system_meta?: {
    callId?: string;
    call_id?: string;
  } | null;
};

const WebIncomingCallGate: React.FC = () => {
  const location = useLocation();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { conversations } = useConversations();
  const rawUser = currentUser as { id?: string; user_id?: string; _id?: string } | null;
  const normalizedUserId = rawUser?.id || rawUser?.user_id || rawUser?._id;
  const isHandledByChatPage =
    location.pathname === "/chat" || location.pathname.startsWith("/chat/");
  const isCallPage = location.pathname === "/call";

  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [modalInfo, setModalInfo] = useState<{ title: string; body: string } | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const pendingCallNameRef = useRef("Người dùng");
  const declinedIncomingCallRef = useRef<string | null>(null);

  useEffect(() => {
    setAvatarBroken(false);
    declinedIncomingCallRef.current = null;
  }, [incomingCall?.conversationId, incomingCall?.callId]);

  const findConversation = (conversationId: string) =>
    conversations.find((item) => item.conversation._id === conversationId)?.conversation;

  const doOpenCallWindow = (payload: IncomingCallPayload) => {
    const targetConv = findConversation(payload.conversationId);
    const displayName = targetConv
      ? getConversationDisplayName(targetConv, normalizedUserId)
      : payload.callerId;
    const displayAvatar = targetConv
      ? getConversationDisplayAvatar(targetConv, normalizedUserId) || ""
      : "";
    const effectiveCallType = payload.isGroup ? "video" : payload.callType;
    const params = new URLSearchParams({
      conversationId: payload.conversationId,
      type: effectiveCallType,
      action: "join",
      name: displayName || "Cuộc gọi",
      avatar: displayAvatar.startsWith("data:") ? "" : displayAvatar,
    });

    if (payload.callId) {
      params.set("callId", payload.callId);
    }
    if (payload.isGroup) {
      params.set("isGroup", "true");
      params.set("transport", "livekit");
    }

    const callWindow = window.open(
      `/call?${params.toString()}`,
      "riff-call-window",
      "width=1180,height=760,menubar=no,toolbar=no,location=no,status=no",
    );

    if (!callWindow) {
      window.location.href = `/call?${params.toString()}`;
    }
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;

    const blockReason = getCallOpenBlockReason(incomingCall.conversationId);
    if (blockReason === "other") {
      setModalInfo({
        title: "Đang trong cuộc gọi",
        body: "Bạn đang trong một cuộc gọi khác. Vui lòng kết thúc trước khi nhận cuộc gọi mới.",
      });
      return;
    }
    if (blockReason === "same") {
      setIncomingCall(null);
      return;
    }

    doOpenCallWindow(incomingCall);
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall || !normalizedUserId) return;
    const declineKey = incomingCall.callId || incomingCall.conversationId;
    if (declinedIncomingCallRef.current === declineKey) return;

    declinedIncomingCallRef.current = declineKey;
    socketService.declineCall(
      incomingCall.conversationId,
      normalizedUserId,
      incomingCall.callerId,
      incomingCall.callId,
    );
    setIncomingCall(null);
  };

  useEffect(() => {
    if (!isAuthenticated || !normalizedUserId || isCallPage || isHandledByChatPage) {
      setIncomingCall(null);
      return;
    }

    socketService.connect();
    socketService.joinUserRoom(normalizedUserId);

    const onIncomingCall = (payload: IncomingCallPayload) => {
      if (!payload?.conversationId) return;
      if (String(payload.callerId) === String(normalizedUserId)) return;

      const blockReason = getCallOpenBlockReason(payload.conversationId);
      if (blockReason === "other") {
        socketService.declineCall(
          payload.conversationId,
          normalizedUserId,
          payload.callerId,
          payload.callId,
        );
        return;
      }
      if (blockReason === "same") return;

      const targetConv = findConversation(payload.conversationId);
      pendingCallNameRef.current = targetConv
        ? getConversationDisplayName(targetConv, normalizedUserId)
        : payload.callerId || "Người dùng";
      setIncomingCall(payload);
    };

    const clearIncoming = (payload: { conversationId: string; callId?: string }) => {
      setIncomingCall((prev) => {
        if (!prev) return null;
        if (
          String(prev.conversationId) === String(payload.conversationId) &&
          (!prev.callId || (payload.callId && String(prev.callId) === String(payload.callId)))
        ) {
          return null;
        }
        return prev;
      });
    };

    const onNewMessage = (message: CallOutcomeMessagePayload) => {
      if (
        !["call_end", "call_missed", "call_cancel", "call_no_answer", "call_busy"].includes(
          String(message.type || ""),
        )
      ) {
        return;
      }

      setIncomingCall((prev) => {
        if (!prev) return null;
        const messageCallId = message.system_meta?.callId || message.system_meta?.call_id || "";
        if (
          String(prev.conversationId) === String(message.conversation_id) &&
          (!prev.callId || (messageCallId && String(prev.callId) === String(messageCallId)))
        ) {
          return null;
        }
        return prev;
      });
    };

    socketService.onIncomingCall(onIncomingCall);
    socketService.onCallEnded(clearIncoming);
    socketService.onCallDeclined(clearIncoming);
    socketService.onNewMessage(onNewMessage);

    return () => {
      socketService.offIncomingCall(onIncomingCall);
      socketService.offCallEnded(clearIncoming);
      socketService.offCallDeclined(clearIncoming);
      socketService.offNewMessage(onNewMessage);
    };
  }, [
    conversations,
    isAuthenticated,
    isCallPage,
    isHandledByChatPage,
    normalizedUserId,
  ]);

  const incomingTargetConv = incomingCall ? findConversation(incomingCall.conversationId) : null;
  const callerName = incomingTargetConv
    ? getConversationDisplayName(incomingTargetConv, normalizedUserId)
    : incomingCall?.callerId || "";
  const callerAvatarRaw = incomingTargetConv
    ? getConversationDisplayAvatar(incomingTargetConv, normalizedUserId) || ""
    : "";
  const callerAvatarSrc = callerAvatarRaw ? getFullUrl(callerAvatarRaw) : "";
  const callerInitial = (callerName || "U").charAt(0).toUpperCase();

  return (
    <>
      {incomingCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 transition-all">
          <div className="relative w-72 overflow-hidden rounded-[2rem] bg-stone-900 text-white shadow-2xl ring-1 ring-amber-500/20 animate-scale-in">
            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />

            <div className="flex flex-col items-center px-6 pb-8 pt-8">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-amber-400/80">
                {incomingCall.isGroup || incomingCall.callType === "video"
                  ? "Cuộc gọi video"
                  : "Cuộc gọi thoại"}
              </p>

              <div className="relative mb-4 mt-2">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-stone-800 text-3xl font-bold shadow-xl ring-4 ring-stone-900">
                  {callerAvatarSrc && !avatarBroken ? (
                    <img
                      src={callerAvatarSrc}
                      alt={callerName}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    <span className="text-stone-300">{callerInitial}</span>
                  )}
                </div>
                <span className="absolute bottom-1 right-1 h-4 w-4 animate-pulse rounded-full bg-green-500 ring-4 ring-stone-900" />
              </div>

              <h3 className="text-xl font-semibold text-stone-100">{callerName}</h3>
              <p className="mt-1 text-sm text-stone-400">
                {incomingCall.isGroup || incomingCall.callType === "video"
                  ? "Đang gọi video..."
                  : "Đang gọi cho bạn..."}
              </p>

              <div className="mt-8 flex items-center gap-12">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleDeclineIncomingCall}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-all duration-200 hover:scale-105 hover:bg-red-600 active:scale-95"
                    title="Từ chối"
                  >
                    <PhoneOff size={24} />
                  </button>
                  <span className="text-xs font-medium text-stone-400">Từ chối</span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleAcceptIncomingCall}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-105 hover:bg-green-600 active:scale-95"
                    title="Chấp nhận"
                  >
                    {incomingCall.isGroup || incomingCall.callType === "video" ? (
                      <Video size={24} />
                    ) : (
                      <Phone size={24} />
                    )}
                  </button>
                  <span className="text-xs font-medium text-stone-400">Chấp nhận</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalInfo && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          style={{ background: "rgba(35,26,16,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setModalInfo(null)}
        >
          <div
            className="mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl animate-scale-in"
            style={{ border: "1px solid #e5e0da" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <PhoneCall size={18} />
                </div>
                <h3 className="text-base font-semibold" style={{ color: "#231a10" }}>
                  {modalInfo.title}
                </h3>
              </div>
              <button
                onClick={() => setModalInfo(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
                style={{ color: "#bc9166" }}
              >
                <X size={16} />
              </button>
            </div>
            <p className="px-5 pb-4 text-sm" style={{ color: "#694d31" }}>
              {modalInfo.body}
            </p>
            <div className="flex justify-end px-5 pb-5">
              <button
                onClick={() => setModalInfo(null)}
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all"
                style={{ background: "#ae7f53" }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WebIncomingCallGate;
