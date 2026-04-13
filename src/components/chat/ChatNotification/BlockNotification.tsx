import React from "react";
import { Ban } from "lucide-react";
import { BaseNotification } from "./BaseNotification";

interface BlockNotificationProps {
  content: string;
}

export const BlockNotification: React.FC<BlockNotificationProps> = ({
  content,
}) => {
  return (
    <BaseNotification
      icon={<Ban size={14} className="text-red-500" />}
      content={content}
      badgeClassName="bg-red-50 border-red-100 text-red-700"
    />
  );
};
