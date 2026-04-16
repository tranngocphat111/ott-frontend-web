import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Phone, PhoneOff, Video, PhoneCall, X } from "lucide-react";
import Sidebar from "../components/chat/ChatSidebarLeft";
import { ConversationsProvider, useConversations } from "../contexts/ConversationsContext";
import { useUser } from "../contexts/UserContext";
import type { Conversation, ConversationWithParticipant } from "../types";
import { ChatArea } from "../components";
import { socketService } from "../services";
import {
  getCallOpenBlockReason,
  getConversationDisplayAvatar,
  getConversationDisplayName,
  getFullUrl,
} from "../utils";

type IncomingCallPayload = {
  conversationId: string;
  callerId: string;
  callType: "voice" | "video";
};

/* ─── Reusable Modal (style khớp app) ─────────────────────────────── */
const AppModal: React.FC<{
  title: string;
  body: string;
  onClose: () => void;
  icon?: React.ReactNode;
}> = ({ title, body, onClose, icon }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ background: "rgba(35,26,16,0.45)", backdropFilter: "blur(2px)" }}
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-scale-in"
      style={{ border: "1px solid #e5e0da" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-base" style={{ color: "#231a10" }}>
            {title}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-full transition-colors"
          style={{ color: "#bc9166" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f3f0")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <X size={16} />
        </button>
      </div>
      {/* Body */}
      <p className="px-5 pb-4 text-sm" style={{ color: "#694d31" }}>{body}</p>
      {/* Footer */}
      <div className="px-5 pb-5 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: "#ae7f53" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#8b6642")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ae7f53")}
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
);

const ChatContent: React.FC = () => {
  const { currentUser } = useUser();
  const { conversations } = useConversations();
  const normalizedUserId = currentUser?.user_id || currentUser?._id;

  useEffect(() => {
    socketService.connect();
    if (normalizedUserId) {
      socketService.joinUserRoom(normalizedUserId);
    }
  }, [normalizedUserId]);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [modalInfo, setModalInfo] = useState<{ title: string; body: string } | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const pendingCallNameRef = useRef<string>("Người dùng");
  const pendingCallParamsRef = useRef<{
    payload: IncomingCallPayload;
    action: "join" | "start";
    displayName: string;
    displayAvatar: string;
  } | null>(null);

  useEffect(() => { setAvatarBroken(false); }, [incomingCall?.conversationId]);

  const handleConversationSelect = (item: ConversationWithParticipant) => {
    setSelectedConversation(item.conversation);
  };

  // Helper thực sự mở cửa sổ gọi (sau khi đã xác nhận sẵn sàng)
  const doOpenCallWindow = (payload: IncomingCallPayload, action: "join" | "start", displayName: string, displayAvatar: string) => {
    const params = new URLSearchParams({
      conversationId: payload.conversationId,
      type: payload.callType,
      action,
      name: displayName || "Cuoc goi",
      avatar: displayAvatar,
    });

    const callWindow = window.open(
      `/call?${params.toString()}`,
      "riff-call-window",
      "width=1180,height=760,menubar=no,toolbar=no,location=no,status=no",
    );

    if (!callWindow) {
      window.location.href = `/call?${params.toString()}`;
    }
  };

  const openCallWindow = (payload: IncomingCallPayload, action: "join" | "start" = "join") => {
    const blockReason = getCallOpenBlockReason(payload.conversationId);
    if (blockReason === "other") {
      setModalInfo({ title: "Đang trong cuộc gọi", body: "Bạn đang trong một cuộc gọi khác. Vui lòng kết thúc trước khi gọi mới." });
      return;
    }
    if (blockReason === "same") {
      setModalInfo({ title: "Đang trong cuộc gọi", body: "Bạn đang ở trong cuộc gọi này rồi." });
      return;
    }

    const targetConv = conversations.find(
      (c) => c.conversation._id === payload.conversationId,
    )?.conversation;

    const displayName = targetConv
      ? getConversationDisplayName(targetConv, normalizedUserId)
      : payload.callerId;
    const displayAvatar = targetConv
      ? getConversationDisplayAvatar(targetConv, normalizedUserId) || ""
      : "";

    pendingCallNameRef.current = displayName || "Người dùng";

    // Khi chấp nhận cuộc gọi (join) → mở ngay, không cần pre-check
    if (action === "join") {
      doOpenCallWindow(payload, action, displayName, displayAvatar);
      return;
    }

    // Khi BẮT ĐẦU gọi (start) → pre-check trước, chỉ mở sau khi xác nhận
    // Lưu params để dùng khi nhận san_sang_de_goi
    pendingCallParamsRef.current = { payload, action, displayName, displayAvatar };
    socketService.checkCallAvailability(payload.conversationId, normalizedUserId as string);
  };

  // Lắng nghe kết quả pre-check + postMessage fallback từ CallPage
  useEffect(() => {
    // san_sang_de_goi: server xác nhận người nhận sẵn sàng → mở cửa sổ gọi
    const onCallReady = (resp: { conversationId: string }) => {
      const pending = pendingCallParamsRef.current;
      if (!pending || pending.payload.conversationId !== resp.conversationId) return;
      pendingCallParamsRef.current = null;
      doOpenCallWindow(pending.payload, pending.action, pending.displayName, pending.displayAvatar);
    };

    // nguoi_dung_ban_goi: người nhận đang bận → hiện modal ngay
    const onCallBusy = (payload: { conversationId: string; targetUserId: string }) => {
      pendingCallParamsRef.current = null;

      let displayName = pendingCallNameRef.current;

      // Nếu name vẫn là placeholder ("Người dùng"), thử tìm trong conversations list
      if ((displayName === "Người dùng" || !displayName) && conversations) {
        const targetConv = conversations.find(c => c.conversation._id === payload.conversationId)?.conversation;
        if (targetConv) {
          displayName = getConversationDisplayName(targetConv, normalizedUserId);
        }
      }

      setModalInfo({
        title: "Không thể kết nối",
        body: `${displayName} đang trong một cuộc gọi khác.`,
      });
    };

    // postMessage từ CallPage: dự phòng nếu window kịp mở trước
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "call-target-busy") {
        const name = event.data.name || pendingCallNameRef.current;
        setModalInfo({
          title: "Không thể kết nối",
          body: `${name} đang trong một cuộc gọi khác.`,
        });
      }
    };

    socketService.onCallReady(onCallReady);
    socketService.onCallBusy(onCallBusy);
    window.addEventListener("message", onMessage);

    return () => {
      socketService.offCallReady(onCallReady);
      socketService.offCallBusy(onCallBusy);
      window.removeEventListener("message", onMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    openCallWindow(incomingCall, "join");
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall || !normalizedUserId) return;
    socketService.declineCall(incomingCall.conversationId, normalizedUserId, incomingCall.callerId);
    setIncomingCall(null);
  };

  useEffect(() => {
    if (!normalizedUserId) return;
    const onCallEnded = (payload: { conversationId: string }) => {
      console.log("onCallEnded received:", payload);
      setIncomingCall((prev) => {
        if (!prev) return null;
        if (String(prev.conversationId) === String(payload.conversationId)) {
          console.log("Matching incoming call found, closing modal.");
          return null;
        }
        return prev;
      });
    };

    const onIncomingCall = (payload: IncomingCallPayload) => {
      console.log("onIncomingCall received:", payload);
      if (payload.callerId === normalizedUserId) return;
      setIncomingCall(payload);
    };

    socketService.onIncomingCall(onIncomingCall);
    socketService.onCallEnded(onCallEnded);
    
    // Đảm bảo lắng nghe cả sự kiện người dùng từ chối (cho trường hợp đồng bộ nhiều tab)
    const onCallDeclined = (payload: { conversationId: string }) => {
      setIncomingCall((prev) => (String(prev?.conversationId) === String(payload.conversationId) ? null : prev));
    };
    socketService.onCallDeclined(onCallDeclined);

    return () => {
      socketService.offIncomingCall(onIncomingCall);
      socketService.offCallEnded(onCallEnded);
      socketService.offCallDeclined(onCallDeclined);
    };
  }, [normalizedUserId]);

  useEffect(() => {
    const handleConversationDissolved = (event: Event) => {
      const custom = event as CustomEvent<{ conversationId?: string }>;
      const dissolvedId = String(custom.detail?.conversationId || "");
      if (dissolvedId && selectedConversation?._id === dissolvedId) setSelectedConversation(null);
    };
    window.addEventListener("chat:conversation-dissolved", handleConversationDissolved as EventListener);
    return () => window.removeEventListener("chat:conversation-dissolved", handleConversationDissolved as EventListener);
  }, [selectedConversation?._id]);

  // Resolve caller info
  const incomingTargetConv = incomingCall
    ? conversations.find((c) => c.conversation._id === incomingCall.conversationId)?.conversation
    : null;
  const callerName = incomingTargetConv
    ? getConversationDisplayName(incomingTargetConv, normalizedUserId)
    : incomingCall?.callerId ?? "";
  const callerAvatarRaw = incomingTargetConv
    ? getConversationDisplayAvatar(incomingTargetConv, normalizedUserId) || ""
    : "";
  const callerAvatarSrc = callerAvatarRaw ? getFullUrl(callerAvatarRaw) : "";
  const callerInitial = (callerName || "U").charAt(0).toUpperCase();

  return (
    <div className="flex h-full w-full bg-white" style={{ zoom: 0.9 }}>

      {/* ── INCOMING CALL MODAL (Modern Warm Brown Theme) ─────────────── */}
      {incomingCall && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 transition-all">
          <div className="relative w-72 rounded-[2rem] bg-stone-900 text-white shadow-2xl ring-1 ring-amber-500/20 animate-scale-in overflow-hidden">

            {/* Top accent glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />

            <div className="px-6 pt-8 pb-8 flex flex-col items-center">
              {/* Label */}
              <p className="text-[11px] font-medium tracking-widest uppercase text-amber-400/80 mb-2">
                {incomingCall.callType === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại"}
              </p>

              {/* Avatar */}
              <div className="relative mt-2 mb-4">
                <div className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center bg-stone-800 text-3xl font-bold ring-4 ring-stone-900 shadow-xl">
                  {callerAvatarSrc && !avatarBroken ? (
                    <img
                      src={callerAvatarSrc}
                      alt={callerName}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    <span style={{ fontFamily: "var(--font-body)" }} className="text-stone-300">
                      {callerInitial}
                    </span>
                  )}
                </div>
                {/* Online pulse dot */}
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 ring-4 ring-stone-900 animate-pulse" />
              </div>

              {/* Name */}
              <h3
                className="text-xl font-semibold text-stone-100"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {callerName}
              </h3>
              <p className="text-sm text-stone-400 mt-1">
                {incomingCall.callType === "video" ? "Đang gọi video..." : "Đang gọi cho bạn..."}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-12 mt-8">
                {/* Decline */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleDeclineIncomingCall}
                    className="h-16 w-16 rounded-full flex items-center justify-center bg-red-500 text-white transition-all duration-200 hover:bg-red-600 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
                    title="Từ chối"
                  >
                    <PhoneOff size={24} />
                  </button>
                  <span className="text-xs font-medium text-stone-400">Từ chối</span>
                </div>

                {/* Accept */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleAcceptIncomingCall}
                    className="h-16 w-16 rounded-full flex items-center justify-center bg-green-500 text-white transition-all duration-200 hover:bg-green-600 hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30"
                    title="Chấp nhận"
                  >
                    {incomingCall.callType === "video" ? <Video size={24} /> : <Phone size={24} />}
                  </button>
                  <span className="text-xs font-medium text-stone-400">Chấp nhận</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GENERIC APP MODAL ─────────────── */}
      {modalInfo && (
        <AppModal
          title={modalInfo.title}
          body={modalInfo.body}
          icon={
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-red-50 text-red-500">
              <PhoneCall size={18} />
            </div>
          }
          onClose={() => setModalInfo(null)}
        />
      )}

      {/* ── SIDEBAR ─────────────── */}
      <Sidebar
        onConversationSelect={handleConversationSelect}
        selectedConversationId={selectedConversation?._id}
      />

      {/* ── MAIN CHAT AREA / EMPTY STATE ─────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
        {selectedConversation ? (
          <ChatArea conversation={selectedConversation} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm mx-auto p-8 flex flex-col items-center animate-fade-in">
              <div className="w-20 h-20 mb-6 bg-white rounded-full flex items-center justify-center shadow-sm ring-1 ring-gray-100">
                <MessageCircle className="w-10 h-10 text-primary-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Chào mừng đến với Riff
              </h2>
              <p className="text-sm text-gray-500">
                Hãy chọn một cuộc hội thoại ở thanh bên để bắt đầu trò chuyện.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => (
  <ConversationsProvider>
    <ChatContent />
  </ConversationsProvider>
);

export default ChatPage;
