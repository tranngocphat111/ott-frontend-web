import type { Message } from "../../../types";
import { convertShortcodeToEmoji } from "../../../utils";
import { MessageLayout } from "./MessageLayout";

export const TextMessage = ({
  msg,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  onReply,
  onReact,
}: {
  msg: Message;
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, reactionType: string) => void;
}) => {
  const text = Array.isArray(msg.content)
    ? msg.content.join("")
    : String(msg.content || "");

  return (
    <MessageLayout
      msg={msg}
      isMe={isMe}
      currentUserId={currentUserId}
      isFirst={isFirstInSequence}
      isLast={isLastInSequence}
      onReply={onReply}
      onReact={onReact}
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
