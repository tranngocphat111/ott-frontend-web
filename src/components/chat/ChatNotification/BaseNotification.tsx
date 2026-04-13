import React from "react";
import type { ReactNode } from "react";

interface BaseNotificationProps {
  icon: ReactNode;
  content: string;
  badgeClassName: string;
}

export const BaseNotification: React.FC<BaseNotificationProps> = ({
  icon,
  content,
  badgeClassName,
}) => {
  return (
    <div className="flex justify-center my-2.5 w-full px-6">
      <div
        className={`
        flex items-center gap-2.5
        px-3.5 py-1.5
        rounded-full
        border
        shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]
        transition-all
        ${badgeClassName}
      `}
      >
        <div className="bg-white/80 p-1 rounded-full shadow-sm flex items-center justify-center">
          {icon}
        </div>

        <span className="text-[12.5px] font-medium tracking-tight">
          {content}
        </span>
      </div>
    </div>
  );
};
