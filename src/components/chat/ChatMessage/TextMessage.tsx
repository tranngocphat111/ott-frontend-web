import type { Message } from "../../../types";
import { convertShortcodeToEmoji } from "../../../utils";
import { MessageLayout } from "./MessageLayout";

export const TextMessage = ({
  msg,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  isTopBoundary,
  onReply,
  onReact,
  onRevoke,
  onDelete,
  onPin,
}: {
  msg: Message;
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  isTopBoundary?: boolean;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, reactionType: string) => void;
  onRevoke?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onPin?: (msg: Message) => void;
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
      isTopBoundary={isTopBoundary}
      onReply={onReply}
      onReact={onReact}
      onRevoke={onRevoke}
      onDelete={onDelete}
      onPin={onPin}
    >
      {(borderRadius) => (
        <div
          className={`h-10 px-3 text-[15px] leading-relaxed shadow-sm wrap-break-word whitespace-nowrap overflow-hidden flex items-center transition-all border
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
