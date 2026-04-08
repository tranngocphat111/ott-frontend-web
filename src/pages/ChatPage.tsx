import React, { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import Sidebar from "../components/chat/ChatSidebarLeft";
import { ConversationsProvider } from "../contexts/ConversationsContext";
import { useUser } from "../contexts/UserContext";
import type { Conversation, ConversationWithParticipant } from "../types";
import { ChatArea } from "../components";
import { socketService } from "../services";

type IncomingCallPayload = {
  conversationId: string;
  callerId: string;
  callType: "voice" | "video";
};

const ChatPage: React.FC = () => {
  const { currentUser } = useUser();
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
    const params = new URLSearchParams({
      conversationId: payload.conversationId,
      type: payload.callType,
      action,
      name: selectedConversation?.name || "Cuoc goi",
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

    socketService.onIncomingCall(onIncomingCall);
    return () => socketService.offIncomingCall(onIncomingCall);
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
    <ConversationsProvider>
      <div className="flex h-full w-full" style={{ zoom: 0.9}}>
        {incomingCall && (
          <div className="absolute top-4 right-6 z-30 w-90 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-lg">
            <p className="font-semibold text-blue-900">Cuoc goi den</p>
            <p className="text-sm text-blue-700 mt-1">
              Nguoi goi: {incomingCall.callerId} (
              {incomingCall.callType === "video" ? "Video" : "Voice"})
            </p>
            <div className="flex gap-2 mt-3 justify-end">
              <button
                className="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                onClick={handleDeclineIncomingCall}
              >
                Tu choi
              </button>
              <button
                className="px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                onClick={handleAcceptIncomingCall}
              >
                Nhan
              </button>
            </div>
          </div>
        )}

        {/* Chat Sidebar */}
        <Sidebar
          onConversationSelect={handleConversationSelect}
          selectedConversationId={selectedConversation?._id}
        />

        {/* Chat Area */}
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
    </ConversationsProvider>
  );
};

export default ChatPage;
