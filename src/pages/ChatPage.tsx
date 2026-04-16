import React, { useEffect, useState } from "react";
import { MessageCircle, Phone, PhoneOff } from "lucide-react";
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
} from "../utils";

type IncomingCallPayload = {
  conversationId: string;
  callerId: string;
  callType: "voice" | "video";
};

const ChatContent: React.FC = () => {
  const { currentUser } = useUser();
  const { conversations } = useConversations();
  const normalizedUserId = currentUser?.user_id || currentUser?._id;
  useEffect(() => {
    socketService.connect();
  }, []);

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(
    null,
  );

  const handleConversationSelect = (item: ConversationWithParticipant) => {
    setSelectedConversation(item.conversation);
  };

  const openCallWindow = (
    payload: IncomingCallPayload,
    action: "join" | "start" = "join",
  ) => {
    const blockReason = getCallOpenBlockReason(payload.conversationId);
    if (blockReason === "other") {
      window.alert("Bạn đang ở trong cuộc gọi khác.");
      return;
    }
    if (blockReason === "same") {
      window.alert("Bạn đang ở trong cuộc gọi này.");
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

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    openCallWindow(incomingCall, "join");
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall || !normalizedUserId) return;

    socketService.declineCall(
      incomingCall.conversationId,
      normalizedUserId,
      incomingCall.callerId,
    );
    setIncomingCall(null);
  };

  useEffect(() => {
    if (!normalizedUserId) return;

    const onIncomingCall = (payload: IncomingCallPayload) => {
      if (payload.callerId === normalizedUserId) return;
      setIncomingCall(payload);
    };

    const onCallEnded = (payload: { conversationId: string }) => {
      setIncomingCall((prev) => {
        if (prev && prev.conversationId === payload.conversationId) {
          return null;
        }
        return prev;
      });
    };

    socketService.onIncomingCall(onIncomingCall);
    socketService.onCallEnded(onCallEnded);
    return () => {
      socketService.offIncomingCall(onIncomingCall);
      socketService.offCallEnded(onCallEnded);
    };
  }, [normalizedUserId]);

  useEffect(() => {
    const handleConversationDissolved = (event: Event) => {
      const custom = event as CustomEvent<{ conversationId?: string }>;
      const dissolvedConversationId = String(
        custom.detail?.conversationId || "",
      );

      if (
        dissolvedConversationId &&
        selectedConversation?._id === dissolvedConversationId
      ) {
        setSelectedConversation(null);
      }
    };

    window.addEventListener(
      "chat:conversation-dissolved",
      handleConversationDissolved as EventListener,
    );

    return () => {
      window.removeEventListener(
        "chat:conversation-dissolved",
        handleConversationDissolved as EventListener,
      );
    };
  }, [selectedConversation?._id]);

  return (
    <div className="flex h-full w-full" style={{ zoom: 0.9 }}>
      {incomingCall && (() => {
        const targetConv = conversations.find(
          (c) => c.conversation._id === incomingCall.conversationId,
        )?.conversation;
        const callerNameDisplay = targetConv
          ? getConversationDisplayName(targetConv, normalizedUserId)
          : incomingCall.callerId;
          
        return (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 px-4">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-sm text-white">

              <p className="text-center text-zinc-200 text-sm tracking-wide">
                Cuoc goi den
              </p>
              <div className="mt-4 flex justify-center">
                <div className="h-18 w-18 rounded-full bg-zinc-700 flex items-center justify-center text-xl font-semibold uppercase">
                  {callerNameDisplay?.slice(0, 1) || "U"}
                </div>
              </div>
              <p className="text-center mt-3 text-xl font-semibold">
                {callerNameDisplay}
              </p>
              <p className="text-center text-zinc-300 text-sm mt-1">
                {incomingCall.callType === "video"
                  ? "Video call"
                  : "Voice call"}
              </p>
              <div className="flex justify-center gap-8 mt-6">
                <button
                  className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center"
                  onClick={handleDeclineIncomingCall}
                  title="Tu choi"
                >
                  <PhoneOff size={20} />
                </button>
                <button
                  className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center"
                  onClick={handleAcceptIncomingCall}
                  title="Chap nhan"
                >
                  <Phone size={20} />
                </button>
              </div>
              <div className="mt-3 flex justify-center gap-12 text-xs text-zinc-300">
                <span>Tu choi</span>
                <span>Chap nhan</span>
              </div>
            </div>
          </div>
        );
      })()}

        {/* Chat Sidebar */}
        <Sidebar
          onConversationSelect={handleConversationSelect}
          selectedConversationId={selectedConversation?._id}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <ChatArea conversation={selectedConversation} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Chào mừng đến với Riff App
                </h2>
                <p className="text-gray-600 mb-6">
                  Chọn một cuộc hội thoại để bắt đầu trò chuyện
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

const ChatPage: React.FC = () => {
  return (
    <ConversationsProvider>
      <ChatContent />
    </ConversationsProvider>
  );
};

export default ChatPage;
