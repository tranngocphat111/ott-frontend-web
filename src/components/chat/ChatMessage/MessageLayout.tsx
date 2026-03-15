import React from "react";

import { useMessageSender } from "../../../hooks/useMessageSender";
import {
  getAvatarColor,
  getAvatarLabel,
  getMessageBorderRadius,
} from "../../../utils";

type MessageLayoutProps = {
  msg: any;
  isMe: boolean;
  isFirst: boolean;
  isLast: boolean;
  children: (borderRadius: string) => React.ReactNode;
};

export const MessageLayout = ({
  msg,
  isMe,
  isFirst,
  isLast,
  children,
}: MessageLayoutProps) => {
  const sender = useMessageSender(msg.sender_id, isMe);

  const borderRadius = getMessageBorderRadius(isMe, isFirst, isLast);
  const senderName = sender?.name || "Người lạ";
  const senderAvatarUrl = sender?.avatar;
  const avatarBg = getAvatarColor(senderName);
  const avatarLabel = getAvatarLabel(senderName);

  return (
    <div
      className={`flex w-full ${isLast ? "mb-4" : "mb-0.5"} ${isMe ? "justify-end" : "justify-start gap-2.5"}`}
    >
      {/* CỘT AVATAR */}
      {!isMe && (
        <div className="flex-shrink-0 flex flex-col w-8">
          {isFirst ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm border border-white overflow-hidden mt-1"
              style={{
                backgroundColor: senderAvatarUrl ? "transparent" : avatarBg,
              }}
            >
              {senderAvatarUrl ? (
                <img
                  src={senderAvatarUrl}
                  alt={senderName}
                  className="w-full h-full object-cover"
                />
              ) : (
                avatarLabel
              )}
            </div>
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* CỘT CONTENT */}
      <div
        className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}
      >
        {!isMe && isFirst && (
          <span className="text-[12px] font-semibold text-gray-600 mb-1 ml-1 select-none">
            {senderName}
          </span>
        )}
        {children(borderRadius)}
      </div>
    </div>
  );
};
