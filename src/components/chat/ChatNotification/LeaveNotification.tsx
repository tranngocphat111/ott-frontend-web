import React from "react";
import { LogOut } from "lucide-react";
import { BaseNotification } from "./BaseNotification";

interface LeaveNotificationProps {
  content: string;
}

export const LeaveNotification: React.FC<LeaveNotificationProps> = ({
  content,
}) => {
  return (
    <BaseNotification
      icon={<LogOut size={14} className="text-orange-500" />}
      content={content}
      badgeClassName="bg-orange-50 border-orange-100 text-orange-700"
    />
  );
};
