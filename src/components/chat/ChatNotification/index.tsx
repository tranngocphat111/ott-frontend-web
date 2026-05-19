import React from "react";
import type { ChatNotificationProps } from "../../../types/message.type";
import { AddNotification } from "./AddNotification";
import { BlockNotification } from "./BlockNotification";
import { LeaveNotification } from "./LeaveNotification";
import { PinNotification } from "./PinNotification";
import { UnpinNotification } from "./UnpinNotification";
import { DefaultNotification } from "./DefaultNotification";
import { PollNotification } from "./PollNotification";
import { FriendRequestNotification } from "./FriendRequestNotification";
import { CallJoinNotification } from "./CallJoinNotification";

import { useAuth } from "../../../contexts/AuthContext";

export const ChatNotification: React.FC<ChatNotificationProps> = ({
  type,
  content,
  msgId,
  conversationId,
  sender_id,
  sender_name,
}) => {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;

  let displayContent = content;
  if (
    type === "system_friend_request" &&
    (!displayContent ||
      displayContent === "Đã gửi lời mời kết bạn" ||
      displayContent === "Đã gửi lời mời kết bạn.")
  ) {
    displayContent = sender_name
      ? `${sender_name} đã gửi lời mời kết bạn`
      : "Có lời mời kết bạn mới";
  }

  if (sender_id && currentUserId && String(sender_id) === String(currentUserId)) {
    if (sender_name && content.startsWith(sender_name)) {
      displayContent = "Bạn" + content.slice(sender_name.length);
    } else if (sender_name && displayContent.startsWith(sender_name)) {
      displayContent = "Bạn" + displayContent.slice(sender_name.length);
    }
  }
  switch (type) {
    case "system_poll":
      return (
        <PollNotification
          content={displayContent}
          msgId={msgId}
          conversationId={conversationId}
          sender_id={sender_id}
          sender_name={sender_name}
        />
      );
    case "system_friend_request":
      return <FriendRequestNotification content={displayContent} />;
    case "system_add":
      return <AddNotification content={displayContent} />;
    case "system_block":
      return <BlockNotification content={displayContent} />;
    case "system_leave":
      return <LeaveNotification content={displayContent} />;
    case "system_pin":
      return <PinNotification content={displayContent} />;
    case "system_unpin":
      return <UnpinNotification content={displayContent} />;
    case "call_join":
      return <CallJoinNotification content={displayContent} />;
    case "call_start":
    case "call_end":
    case "call_cancel":
    case "call_no_answer":
      return <DefaultNotification content={displayContent} />;
    default:
      return <DefaultNotification content={displayContent} />;
  }
};
