import React from "react";
import { UserPlus } from "lucide-react";
import { BaseNotification } from "./BaseNotification";

interface AddNotificationProps {
  content: string;
}

export const AddNotification: React.FC<AddNotificationProps> = ({
  content,
}) => {
  return (
    <BaseNotification
      icon={<UserPlus size={14} className="text-teal-600" />}
      content={content}
      badgeClassName="bg-teal-50 border-teal-100 text-teal-700"
    />
  );
};
