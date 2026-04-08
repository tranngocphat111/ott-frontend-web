import { MessageLayout } from "./MessageLayout";

export const RevokedMessage = ({
  msg,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  isTopBoundary,
}: {
  msg: any;
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  isTopBoundary?: boolean;
}) => {
  const placeholder = isMe
    ? "Bạn đã thu hồi một tin nhắn"
    : "Tin nhắn đã được thu hồi";

  const placeholderMessage = {
    ...msg,
    type: "text",
    content: [placeholder],
    reply_to: null,
    reply_to_msg_id: null,
    reactions: [],
    is_revoked: true,
  };

  return (
    <MessageLayout
      msg={placeholderMessage}
      isMe={isMe}
      currentUserId={currentUserId}
      isFirst={isFirstInSequence}
      isLast={isLastInSequence}
      isTopBoundary={isTopBoundary}
    >
      {(borderRadius) => (
        <div
          className={`h-10 px-3 text-[13px] leading-relaxed shadow-sm flex items-center gap-2 overflow-hidden ${borderRadius} ${
            isMe
              ? "bg-[#e8e8e8] border-[#d7c7af] text-[#7b6648]"
              : "bg-gray-2s00 border-slate-300 text-slate-500"
          }`}
        >
          <span className="italic">{placeholder}</span>
        </div>
      )}
    </MessageLayout>
  );
};
