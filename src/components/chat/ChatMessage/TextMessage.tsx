import { useEffect, useMemo, useState } from "react";
import type { Message } from "../../../types";
import { EmojiText } from "../EmojiText";
import { MessageLayout } from "./MessageLayout";
import { AiService } from "../../../services";
import { Languages, Loader2 } from "lucide-react";
import { getMessageTranslationCandidate } from "../../../utils/translationDetection";

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
  onForward,
  participants,
  translatedText,
  conversationType,
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
  onForward?: (msg: Message) => void;
  participants?: any[];
  translatedText?: string;
  conversationType?: string;
}) => {
  const [manualTranslatedText, setManualTranslatedText] = useState<string | null>(null);
  const [isTranslatingLocal, setIsTranslatingLocal] = useState(false);
  const [translationUnavailable, setTranslationUnavailable] = useState(false);

  const text = useMemo(() => {
    const raw = msg.content;
    if (Array.isArray(raw)) {
      return raw.map(c => typeof c === 'string' ? c : (c as any)?.text || '').join("");
    }
    return typeof raw === 'string' ? raw : (raw as any)?.text || String(raw || "");
  }, [msg.content]);

  useEffect(() => {
    setManualTranslatedText(null);
    setIsTranslatingLocal(false);
    setTranslationUnavailable(false);
  }, [text]);

  const translationCandidate = useMemo(
    () => getMessageTranslationCandidate(text),
    [text],
  );
  const shownTranslatedText = translatedText || manualTranslatedText;
  const shouldShowTranslationButton =
    !isMe &&
    !translatedText &&
    !manualTranslatedText &&
    !translationUnavailable &&
    Boolean(text.trim()) &&
    translationCandidate.shouldOffer;

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
      onForward={onForward}
      participants={participants}
      conversationType={conversationType}
    >
      {(borderRadius, renderMessageMeta) => (
        <div
          className={`px-3 py-2 text-[15px] leading-relaxed shadow-sm wrap-break-word whitespace-pre-wrap transition-all border ${isMe ? "text-right" : "text-left"}
          ${
            isMe
              ? "bg-chat-me text-chat-me-text border-chat-me"
              : "bg-chat-other text-chat-other-text border-chat-other-border"
          }
          ${borderRadius} 
          `}
        >
          <EmojiText
            text={text}
            emojiSize={18}
            emojiClassName="inline-block align-[-0.2em] me-1"
          />
          {text.trim() && shownTranslatedText && shownTranslatedText.trim() !== text.trim() && (
            <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 opacity-90 italic text-[14px]">
              <div className="flex items-center gap-1.5 mb-1 opacity-60 not-italic">
                <span className="text-[10px] font-bold uppercase tracking-tighter">Bản dịch</span>
              </div>
              <EmojiText
                text={shownTranslatedText}
                emojiSize={16}
                emojiClassName="inline-block align-[-0.2em] me-1"
              />
            </div>
          )}

          {shouldShowTranslationButton && (
            <button
              type="button"
              disabled={isTranslatingLocal}
              onClick={async () => {
                if (isTranslatingLocal) return;
                setIsTranslatingLocal(true);
                try {
                  const result = await AiService.translateText(text);
                  if (result) {
                    setManualTranslatedText(result);
                  } else {
                    setTranslationUnavailable(true);
                  }
                } catch (err) {
                  console.error("Manual translation error:", err);
                  setTranslationUnavailable(true);
                } finally {
                  setIsTranslatingLocal(false);
                }
              }}
              className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary-500 hover:text-primary-600 transition-colors bg-primary-50/50 hover:bg-primary-50 px-2 py-0.5 rounded-md w-fit"
              aria-label="Dịch tin nhắn"
              title="Dịch tin nhắn"
            >
              {isTranslatingLocal ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Languages size={12} />
              )}
              {isTranslatingLocal ? "Đang dịch..." : "Dịch tin nhắn"}
            </button>
          )}
          {renderMessageMeta() && (
            <div
              className={`mt-1 flex ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              {renderMessageMeta()}
            </div>
          )}
        </div>
      )}
    </MessageLayout>
  );
};
