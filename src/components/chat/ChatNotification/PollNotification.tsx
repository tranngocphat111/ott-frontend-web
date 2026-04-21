import React from "react";
import { BarChart2 } from "lucide-react";
import { BaseNotification } from "./BaseNotification";
import { useAuth } from "../../../contexts/AuthContext";

interface PollNotificationProps {
  content: string;
  msgId?: string;
  conversationId?: string;
  sender_id?: string;
  sender_name?: string;
}

export const PollNotification: React.FC<PollNotificationProps> = ({
  content,
  msgId,
  conversationId,
  sender_id,
  sender_name,
}) => {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;

  const displayContent = React.useMemo(() => {
    if (sender_id && currentUserId && String(sender_id) === String(currentUserId)) {
      if (sender_name && content.startsWith(sender_name)) {
        return "Bạn" + content.slice(sender_name.length);
      }
    }
    return content;
  }, [content, sender_id, currentUserId, sender_name]);

  const handleJump = () => {
    if (!msgId || !conversationId) return;

    window.dispatchEvent(
      new CustomEvent("chat:jump", {
        detail: {
          conversationId,
          messageId: msgId,
          highlight: true,
        },
      })
    );
  };

  return (
    <BaseNotification
      icon={<BarChart2 size={14} className="text-emerald-500" />}
      content={
        <div className="flex items-center gap-2">
          <span className="truncate max-w-[200px]">{displayContent}</span>
        </div>
      }
      badgeClassName="bg-emerald-50 border-emerald-100 text-slate-700"
    />
  );
};
