import React from "react";
import { Settings } from "lucide-react";
import { BaseNotification } from "./BaseNotification";

interface DefaultNotificationProps {
  content: string;
}

export const DefaultNotification: React.FC<DefaultNotificationProps> = ({
  content,
}) => {
  return (
    <BaseNotification
      icon={<Settings size={14} className="text-gray-400" />}
      content={content}
      badgeClassName="bg-gray-50 border-gray-100 text-gray-500"
    />
  );
};
