// src/components/Chat/ChatMessage/LinkMessage.tsx
import { useMemo } from "react";
import { Globe, ArrowUpRight, Link as LinkIcon } from "lucide-react";
import type { Message } from "../../../types";
import { MessageLayout } from "./MessageLayout";

const getSafeLink = (rawValue: string): string | null => {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const maybeUrl = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(maybeUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
};

export const LinkMessage = ({
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

  const { safeLink, domain, favicon } = useMemo(() => {
    const link = getSafeLink(text);
    if (!link) return { safeLink: null, domain: "", favicon: "" };
    const urlObj = new URL(link);
    const host = urlObj.hostname.replace("www.", "");
    return {
      safeLink: link,
      domain: host,
      favicon: `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
    };
  }, [text]);

  const isPureLink = useMemo(() => {
    if (!safeLink) return false;
    const cleanText = text.trim().toLowerCase().replace(/\/$/, "");
    const cleanLink = safeLink.toLowerCase().replace(/\/$/, "");
    return cleanText === cleanLink || cleanText === domain.toLowerCase();
  }, [text, safeLink, domain]);

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
          className={`group relative max-w-[320px] shadow-sm transition-all border overflow-hidden ${
            isMe
              ? "bg-chat-me text-chat-me-text border-white/10"
              : "bg-chat-other text-chat-other-text border-black/5"
          } ${borderRadius}`}
        >
          {safeLink ? (
            <a
              href={safeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block no-underline group/link"
            >
              <div className="flex flex-col">
                {/* Header: Logo + Domain */}
                <div className="px-3 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      {favicon ? (
                        <img
                          src={favicon}
                          alt=""
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"; // Ẩn img nếu lỗi
                            const next = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            if (next) next.style.display = "block"; // Hiện Globe
                          }}
                        />
                      ) : null}
                      <Globe
                        size={14}
                        className="opacity-50"
                        style={{ display: favicon ? "none" : "block" }}
                      />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 truncate">
                      {domain}
                    </span>
                  </div>
                  <ArrowUpRight
                    size={14}
                    className="opacity-40 group-hover/link:opacity-100 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                  />
                </div>

                {/* Content Box */}
                <div className="p-2">
                  <div
                    className={`rounded-lg p-3 transition-all ${
                      isMe
                        ? "bg-white/10 group-hover/link:bg-white/15"
                        : "bg-black/5 group-hover/link:bg-black/10"
                    }`}
                  >
                    <div className="text-[14px] leading-relaxed break-words font-medium">
                      {text}
                    </div>

                    {!isPureLink && (
                      <div className="mt-2 flex items-center gap-1 opacity-40 border-t border-current/5 pt-1.5">
                        <LinkIcon size={10} className="shrink-0" />
                        <span className="text-[10px] truncate italic">
                          {safeLink}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ) : (
            <div className="px-3 py-2">{text}</div>
          )}
        </div>
      )}
    </MessageLayout>
  );
};
