import React from "react";
import type { ChatNotificationProps } from "../../../types/message.type";
import { AddNotification } from "./AddNotification";
import { BlockNotification } from "./BlockNotification";
import { LeaveNotification } from "./LeaveNotification";
import { PinNotification } from "./PinNotification";
import { UnpinNotification } from "./UnpinNotification";
import { DefaultNotification } from "./DefaultNotification";

export const ChatNotification: React.FC<ChatNotificationProps> = ({
  type,
  content,
}) => {
  switch (type) {
    case "system_add":
      return <AddNotification content={content} />;
    case "system_block":
      return <BlockNotification content={content} />;
    case "system_leave":
      return <LeaveNotification content={content} />;
    case "system_pin":
      return <PinNotification content={content} />;
    case "system_unpin":
      return <UnpinNotification content={content} />;
    case "call_start":
    case "call_join":
    case "call_end":
    case "call_cancel":
    case "call_no_answer":
      return <DefaultNotification content={content} />;
    default:
      return <DefaultNotification content={content} />;
  }
};
