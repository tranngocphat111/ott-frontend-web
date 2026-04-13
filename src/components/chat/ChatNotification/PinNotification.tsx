import React from "react";
import { Pin } from "lucide-react";
import { BaseNotification } from "./BaseNotification";

interface PinNotificationProps {
  content: string;
}

export const PinNotification: React.FC<PinNotificationProps> = ({
  content,
}) => {
  return (
    <BaseNotification
      icon={<Pin size={14} className="text-blue-600" />}
      content={content}
      badgeClassName="bg-blue-50 border-blue-100 text-blue-700"
    />
  );
};
