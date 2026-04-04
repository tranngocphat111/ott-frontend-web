import { MessageCircle } from "lucide-react";

export const ChatEmpty = () => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
    <MessageCircle size={48} className="mb-2" />
    <p className="font-medium">Bắt đầu cuộc trò chuyện ngay</p>
    <p className="text-xs">Gửi tin nhắn để kết nối với đối phương</p>
  </div>
);
