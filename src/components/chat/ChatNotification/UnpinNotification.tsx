import React from "react";
import { PinOff } from "lucide-react";
import { BaseNotification } from "./BaseNotification";

interface UnpinNotificationProps {
  content: string;
}

export const UnpinNotification: React.FC<UnpinNotificationProps> = ({
  content,
}) => {
  return (
    <BaseNotification
      icon={<PinOff size={14} className="text-slate-600" />}
      content={content}
      badgeClassName="bg-slate-100 border-slate-200 text-slate-700"
    />
  );
};
