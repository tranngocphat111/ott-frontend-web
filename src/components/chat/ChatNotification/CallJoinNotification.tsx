import React from "react";
import { Video } from "lucide-react";
import { BaseNotification } from "./BaseNotification";

interface CallJoinNotificationProps {
  content: string;
}

export const CallJoinNotification: React.FC<CallJoinNotificationProps> = ({
  content,
}) => {
  return (
    <BaseNotification
      icon={<Video size={14} className="text-amber-700" />}
      content={content}
      badgeClassName="bg-amber-50 border-amber-200 text-amber-800"
    />
  );
};
