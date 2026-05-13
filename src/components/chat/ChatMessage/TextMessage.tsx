import { useMemo, useState } from "react";
import type { Message } from "../../../types";
import { EmojiText } from "../EmojiText";
import { MessageLayout } from "./MessageLayout";
import { AiService } from "../../../services";
import { Languages, Loader2 } from "lucide-react";

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
}) => {
  const [manualTranslatedText, setManualTranslatedText] = useState<string | null>(null);
  const [isTranslatingLocal, setIsTranslatingLocal] = useState(false);

  const text = useMemo(() => {
    const raw = msg.content;
    if (Array.isArray(raw)) {
      return raw.map(c => typeof c === 'string' ? c : (c as any)?.text || '').join("");
    }
    return typeof raw === 'string' ? raw : (raw as any)?.text || String(raw || "");
  }, [msg.content]);

  const hasForeignLanguage = useMemo(() => {
    if (!text || text.trim().length < 3) return false;
    
    const trimmedText = text.trim();
    // Bỏ qua các chuỗi vô nghĩa không có nguyên âm (gibberish)
    // Nguyên âm tiếng Việt và tiếng Anh cơ bản
    const vowels = /[aeiouyàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i;
    if (!vowels.test(trimmedText)) {
      return false;
    }

    // Chứa các ký tự đặc trưng của ngoại ngữ (w, f, j, z)
    const foreignChars = /[fwjz]/i;
    // Chứa các từ tiếng Anh thông dụng
    const commonEnglish = /\b(the|and|for|with|you|your|have|this|that|from|shoes|size|hello|need|what|how|where|when|are|is|can|will|but|not|yes|no)\b/i;
    // Hoàn toàn không có dấu tiếng Việt
    const noVnAccents = !/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(trimmedText);
    
    return foreignChars.test(trimmedText) || commonEnglish.test(trimmedText) || noVnAccents;
  }, [text]);

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
          <EmojiText
            text={text}
            emojiSize={18}
            emojiClassName="inline-block align-[-0.2em] me-1"
          />
          {text.trim() && (translatedText || manualTranslatedText) && (translatedText || manualTranslatedText)?.trim() !== text.trim() && (
            <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 opacity-90 italic text-[14px]">
              <div className="flex items-center gap-1.5 mb-1 opacity-60 not-italic">
                <span className="text-[10px] font-bold uppercase tracking-tighter">Bản dịch</span>
              </div>
              <EmojiText
                text={(translatedText || manualTranslatedText) || ""}
                emojiSize={16}
                emojiClassName="inline-block align-[-0.2em] me-1"
              />
            </div>
          )}

          {!isMe && !translatedText && !manualTranslatedText && text.trim() && hasForeignLanguage && (
            <button
              onClick={async () => {
                if (isTranslatingLocal) return;
                setIsTranslatingLocal(true);
                try {
                  const result = await AiService.translateText(text);
                  setManualTranslatedText(result);
                } catch (err) {
                  console.error("Manual translation error:", err);
                } finally {
                  setIsTranslatingLocal(false);
                }
              }}
              className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary-500 hover:text-primary-600 transition-colors bg-primary-50/50 hover:bg-primary-50 px-2 py-0.5 rounded-md w-fit"
            >
              {isTranslatingLocal ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Languages size={12} />
              )}
              {isTranslatingLocal ? "Đang dịch..." : "Dịch tin nhắn"}
            </button>
          )}
        </div>
      )}
    </MessageLayout>
  );
};
