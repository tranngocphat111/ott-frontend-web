import { ImageIcon, SendHorizonal } from "lucide-react";
import { useState } from "react";

export const ChatInput = ({ onSend }: { onSend: (text: string) => void }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-full border border-gray-200">
        <button className="p-2 text-gray-400 hover:text-gray-600">
          <ImageIcon size={20} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Nhập tin nhắn..."
          className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm"
        />
        {text.trim() && (
          <button
            onClick={handleSend}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-[#EFDCCB] rounded-full"
          >
            <SendHorizonal size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
