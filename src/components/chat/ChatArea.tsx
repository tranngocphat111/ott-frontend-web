import React, { useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  Image as ImageIcon,
  Smile,
  SendHorizonal,
} from "lucide-react";
import Avatar from "../common/Avatar";
import type { ChatAreaProps, Message } from "../../interfaces";
import { MessageService, socketService } from "../../services";
import { useUser } from "../../contexts/UserContext";

const ChatArea: React.FC<ChatAreaProps> = ({ conversation }) => {
  const { currentUser } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref để auto scroll xuống cuối
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ================= SOCKET CONNECTION ================= */
  useEffect(() => {
    // Kết nối socket khi component mount
    socketService.connect();

    return () => {
      // Cleanup socket listeners khi unmount
      socketService.offNewMessage();
    };
  }, []);

  /* ================= LOAD MESSAGES ================= */
  useEffect(() => {
    if (!conversation?._id) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        // Reset message cũ để tránh hiện tin nhắn của hội thoại trước
        setMessages([]);
        const data = await MessageService.getMessages(conversation._id);
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch (error) {
        console.error("Load messages failed", error);
      } finally {
        setLoading(false);
      }
    };
    loadMessages();

    // Join conversation room để nhận tin nhắn realtime
    socketService.joinConversation(conversation._id);
  }, [conversation._id]);

  /* ================= LISTEN TO NEW MESSAGES ================= */
  useEffect(() => {
    // Lắng nghe tin nhắn mới từ socket (chỉ setup 1 lần)
    const handleNewMessage = (newMessage: any) => {
      console.log("📨 [ChatArea] Received new message:", newMessage);
      console.log("📍 Current conversation ID:", conversation?._id);
      console.log(
        "📍 Message conversation ID:",
        newMessage.conversation_id || newMessage.conversationId,
      );

      // Chỉ thêm tin nhắn nếu thuộc conversation hiện tại
      const msgConvId = newMessage.conversation_id || newMessage.conversationId;
      if (msgConvId === conversation?._id) {
        console.log("✅ Adding message to current conversation");
        setMessages((prev) => {
          // Tránh duplicate: kiểm tra xem tin nhắn đã tồn tại chưa
          const exists = prev.some((msg) => msg._id === newMessage._id);
          if (exists) {
            console.log("⚠️ Message already exists, skipping");
            return prev;
          }
          return [...prev, newMessage];
        });
      } else {
        console.log("⏭️ Message for different conversation, ignoring");
      }
    };

    socketService.onNewMessage(handleNewMessage);

    // Cleanup listener khi component unmount
    return () => {
      socketService.offNewMessage(handleNewMessage);
    };
  }, [conversation?._id]);

  // Scroll xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */
  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser?._id) return;

    try {
      // Gửi tin nhắn qua API, backend sẽ emit socket event
      await MessageService.sendMessage(
        conversation._id,
        currentUser._id,
        messageText,
      );

      // Không cần setMessages ở đây vì socket sẽ nhận và update
      setMessageText("");
    } catch (error) {
      console.error("Send message failed", error);
    }
  };

  /* ================= HELPERS ================= */
  const getConversationName = (): string => {
    if (conversation.name) return conversation.name;
    if (conversation.type === "private" && conversation.participants?.length) {
      return conversation.participants[0].display_name;
    }
    return "Conversation";
  };

  const getConversationAvatar = (): string | undefined => {
    if (conversation.avatar) return conversation.avatar;
    if (conversation.type === "private" && conversation.participants?.length) {
      return conversation.participants[0].avatar;
    }
    return undefined;
  };

  /* ================= RENDER ================= */
  return (
    // Thay đổi 1: Nền tổng thể màu xám nhạt (#F2F4F7) thay vì trắng
    <div className="flex-1 flex flex-col bg-[#F2F4F7] h-full">
      {/* Header: Giữ màu trắng để tách biệt, thêm shadow nhẹ */}
      <div className="px-6 py-3 bg-white border-b border-gray-100 shadow-sm flex-none z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={getConversationAvatar()}
              name={getConversationName()}
              size={48}
              className="ring-2 ring-white shadow-sm"
            />
            <div>
              <h2 className="font-bold text-gray-800 text-lg">
                {getConversationName()}
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-green-600 font-medium">
                  Đang hoạt động
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 text-primary-500">
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <Phone size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <Video size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
            <MessageCircle size={48} className="mb-2" />
            <p>Bắt đầu cuộc trò chuyện ngay</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            // Logic check người gửi
            const isMe = msg.sender_id === currentUser?._id;

            return (
              <div
                key={msg._id || index}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    px-5 py-3 max-w-[70%] text-[15px] leading-relaxed shadow-sm wrap-break-word
                    ${
                      isMe
                        ? /* Thay đổi 2: Style cho tin nhắn của mình (Màu Beige giống ảnh mẫu) */
                          "bg-[#EFDCCB] text-gray-900 rounded-2xl rounded-tr-sm"
                        : /* Thay đổi 3: Style cho tin nhắn đối phương (Màu Trắng) */
                          "bg-white text-gray-900 rounded-2xl rounded-tl-sm border border-gray-100"
                    }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 flex-none z-20">
        <div
          className="
            flex items-center gap-2 
            bg-gray-50 
            px-2 py-1.5 
            rounded-full 
            border border-gray-200 
       
        "
        >
          {/* Icon Ảnh */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
            <ImageIcon size={20} />
          </button>

          {/* Input chính - Quan trọng: border-none, focus:ring-0 */}
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Nhập tin nhắn..."
            className="
                    flex-1 
                    bg-transparent 
                    border-none 
                    focus:ring-0 
                    outline-none 
                    text-gray-800 
                    placeholder-gray-400 
                    text-sm
                    h-full
                "
          />

          {/* Icon Smile */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
            <Smile size={20} />
          </button>

          {/* Nút gửi */}
          {messageText.trim() ? (
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className={`
                    p-2 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-[#EFDCCB]
                `}
            >
              <SendHorizonal size={20} />
            </button>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
