import type { Message } from "../../../types";
import { convertShortcodeToEmoji } from "../../../utils";
import { MessageLayout } from "./MessageLayout";

export const TextMessage = ({
  msg,
  isMe,
  isFirstInSequence,
  isLastInSequence,
}: {
  msg: Message;
  isMe: boolean;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
}) => {
  const text = Array.isArray(msg.content)
    ? msg.content.join("")
    : String(msg.content || "");

  return (
    <MessageLayout
      msg={msg}
      isMe={isMe}
      isFirst={isFirstInSequence}
      isLast={isLastInSequence}
    >
      {(borderRadius) => (
        <div
          className={`px-3 py-2 text-[15px] leading-relaxed shadow-sm wrap-break-word whitespace-pre-wrap transition-all border
          ${
            isMe
              ? "bg-chat-me text-chat-me-text border-chat-me"
              : "bg-chat-other text-chat-other-text border-chat-other-border"
          }
          ${borderRadius} 
          `}
        >
          {convertShortcodeToEmoji(text)}
        </div>
      )}
    </MessageLayout>
  );
};
