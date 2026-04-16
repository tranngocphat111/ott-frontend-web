import React from 'react';
import { CheckCheck, Check } from 'lucide-react';

export interface Message {
  id: string;
  senderId: string;
  content: string;
  time: string;
  status: 'sent' | 'delivered' | 'seen';
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const getStatusIcon = () => {
    if (message.status === 'seen') {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    }
    return <Check className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span>{message.time}</span>
          {isOwn && getStatusIcon()}
        </div>
      </div>
    </div>
  );
};