import React, { useMemo, useState } from "react";
import { MoreVertical, SmilePlus, Reply } from "lucide-react";

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
  currentUserId?: string;
  onReply?: (msg: any) => void;
  onReact?: (msg: any, reactionType: string) => void;
  children: (borderRadius: string) => React.ReactNode;
};

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const MessageLayout = ({
  msg,
  isMe,
  isFirst,
  isLast,
  currentUserId,
  onReply,
  onReact,
  children,
}: MessageLayoutProps) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const sender = useMessageSender(msg.sender_id, isMe);

  const borderRadius = getMessageBorderRadius(isMe, isFirst, isLast);
  const senderName = sender?.name || "Người lạ";
  const senderAvatarUrl = sender?.avatar;
  const avatarBg = getAvatarColor(senderName);
  const avatarLabel = getAvatarLabel(senderName);
  const replyTo = msg.reply_to;
  const replySenderName =
    replyTo?.sender_id && currentUserId && replyTo.sender_id === currentUserId
      ? "Bạn"
      : "Tin nhắn gốc";

  const reactionGroups = useMemo(() => {
    const reactionMap = new Map<
      string,
      { type: string; count: number; reactedByMe: boolean }
    >();
    const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];

    reactions.forEach((reaction: { user_id?: string; type?: string }) => {
      const reactionType = String(reaction.type || "").trim();
      if (!reactionType) return;

      const existing = reactionMap.get(reactionType);
      if (!existing) {
        reactionMap.set(reactionType, {
          type: reactionType,
          count: 1,
          reactedByMe: !!currentUserId && reaction.user_id === currentUserId,
        });
        return;
      }

      existing.count += 1;
      if (currentUserId && reaction.user_id === currentUserId) {
        existing.reactedByMe = true;
      }
    });

    return Array.from(reactionMap.values());
  }, [msg.reactions, currentUserId]);

  // Tăng margin bottom nếu có reaction để không bị đè vào tin nhắn dưới
  const hasReactions = reactionGroups.length > 0;
  const containerMargin = isLast ? "mb-5" : hasReactions ? "mb-4" : "mb-1";

  return (
    <div
      className={`flex w-full ${containerMargin} ${
        isMe ? "justify-end" : "justify-start gap-2.5"
      }`}
    >
      {/* CỘT AVATAR */}
      {!isMe && (
        <div className="shrink-0 flex flex-col w-8">
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
        className={`group flex flex-col max-w-[75%] sm:max-w-[70%] ${
          isMe ? "items-end" : "items-start"
        } relative`}
        onMouseLeave={() => setShowReactionPicker(false)}
      >
        {!isMe && isFirst && (
          <span className="text-[12px] font-medium text-slate-500 mb-1 ml-1 select-none">
            {senderName}
          </span>
        )}

        {/* THIẾT KẾ LẠI TIN NHẮN REPLY */}
        {replyTo && (
          <div
            className={`mb-1.5 max-w-full rounded-md px-3 py-1.5 transition-colors ${
              isMe
                ? "bg-black/5 border-l-[3px] border-[#C1A882] text-[#5A4529]" // Nền xám/vàng trong suốt, viền nâu nhạt
                : "bg-black/5 border-l-[3px] border-slate-300 text-slate-600" // Nền xám trong suốt, viền xám
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-[2px] text-[12px]">
              <Reply
                size={13}
                strokeWidth={2.5}
                className={isMe ? "text-[#9A7545]" : "text-slate-400"}
              />
              <span className="truncate">{replySenderName}</span>
            </div>
            <div className="truncate opacity-90 text-[13px]">
              {replyTo.content || "[Đính kèm]"}
            </div>
          </div>
        )}

        <div className="relative w-fit max-w-full">
          {/* NỘI DUNG TIN NHẮN CHÍNH */}
          {children(borderRadius)}

          {/* THANH ICON THAO TÁC (REPLY, REACT, MORE) */}
          {(onReply || onReact) && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 z-10 flex items-center gap-0.5 ${
                isMe ? "right-full mr-2" : "left-full ml-2"
              } ${
                showReactionPicker
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              } transition-all duration-200`}
            >
              <button
                type="button"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Tùy chọn"
              >
                <MoreVertical size={16} strokeWidth={2} />
              </button>

              {onReply && (
                <button
                  type="button"
                  onClick={() => onReply(msg)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Trả lời"
                >
                  <Reply size={16} strokeWidth={2} />
                </button>
              )}

              {onReact && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowReactionPicker((prev) => !prev);
                  }}
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    showReactionPicker
                      ? "text-slate-600 bg-slate-100"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Thả reaction"
                >
                  <SmilePlus size={16} strokeWidth={2} />
                </button>
              )}
            </div>
          )}

          {/* BẢNG CHỌN QUICK REACTION */}
          {showReactionPicker && onReact && (
            <div
              className={`absolute bottom-full mb-2 rounded-full bg-white border border-slate-200 shadow-md px-2 py-1.5 flex items-center gap-1 z-30 ${
                isMe ? "right-0" : "left-0"
              }`}
            >
              {QUICK_REACTIONS.map((reaction) => (
                <button
                  key={reaction}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReact(msg, reaction);
                    setShowReactionPicker(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 hover:scale-110 text-xl transition-transform"
                  title={`Thả ${reaction}`}
                >
                  {reaction}
                </button>
              ))}
            </div>
          )}

          {/* HIỂN THỊ REACTION ĐÃ THẢ (Fix lỗi chồng dọc) */}
          {hasReactions && (
            <div
              className={`absolute -bottom-3.5 ${
                isMe ? "right-1" : "left-1"
              } flex flex-row items-center gap-1 z-20`}
            >
              {reactionGroups.map((reaction) => (
                <button
                  key={reaction.type}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReact?.(msg, reaction.type);
                  }}
                  className={`inline-flex items-center justify-center rounded-full bg-white shadow-sm border px-1.5 py-[2px] transition-transform hover:scale-105 ${
                    reaction.reactedByMe
                      ? "border-blue-300 text-blue-600"
                      : "border-slate-200 text-slate-600"
                  }`}
                  title="Đổi reaction"
                >
                  <span className="text-[13px] leading-none">
                    {reaction.type}
                  </span>
                  {reaction.count > 1 && (
                    <span className="ml-1 text-[11px] font-bold leading-none">
                      {reaction.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
