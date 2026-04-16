import React, { useState } from 'react';
import { Paperclip, Image, Smile, Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onAttachFile?: () => void;
  onAttachImage?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage,
  onAttachFile,
  onAttachImage
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="flex items-end gap-2">
        <button 
          onClick={onAttachFile}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Paperclip className="w-5 h-5 text-gray-600" />
        </button>
        <button 
          onClick={onAttachImage}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Image className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            rows={1}
            className="w-full px-4 py-2.5 pr-12 bg-gray-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32"
          />
          <button className="absolute right-3 bottom-2.5 p-1 hover:bg-gray-200 rounded-lg transition-colors">
            <Smile className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};