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
  isTopBoundary,
  onReply,
  onReact,
  onRevoke,
  onDelete,
  onPin,
  onForward,
  participants,
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
  participants?: unknown[];
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

  const isGroupInviteLink = useMemo(() => {
    if (!safeLink) return false;
    try {
      const url = new URL(safeLink);
      return url.pathname === "/join" && url.searchParams.has("token");
    } catch {
      return false;
    }
  }, [safeLink]);

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
    >
      {(borderRadius) => (
        <div
          className={`group relative shadow-sm transition-all border overflow-hidden ${isMe
              ? "bg-chat-me text-chat-me-text border-white/10"
              : "bg-chat-other text-chat-other-text border-black/5"
            } ${borderRadius} ${isGroupInviteLink ? "max-w-[320px] bg-white border-blue-100" : "max-w-[320px]"}`}
        >
          {safeLink ? (
            isGroupInviteLink ? (
              <a
                href={safeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block no-underline group/link"
              >
                <div className="px-3 pt-3 pb-2 break-all text-[13px] text-primary-600 underline">
                  {safeLink}
                </div>
                <div className="mx-3 mb-3 border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-6 flex items-center gap-4 text-white relative overflow-hidden">
                    {/* Circle decorations */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4"></div>

                    <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0 rounded-full shadow-sm z-10">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="z-10">
                      <div className="text-white/90 text-[13px] font-medium mb-0.5">Nhóm</div>
                      <div className="font-bold text-base leading-tight">Link tham gia nhóm</div>
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-white">
                    <div className="text-[14px] font-semibold text-gray-900 mb-0.5">Tham gia nhóm chat</div>
                    <div className="text-[12px] text-gray-500">Bấm vào đây để tham gia nhóm</div>
                  </div>
                </div>
              </a>
            ) : (
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
                              e.currentTarget.style.display = "none";
                              const next = e.currentTarget
                                .nextElementSibling as HTMLElement;
                              if (next) next.style.display = "block";
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
                      className={`rounded-lg p-3 transition-all ${isMe
                          ? "bg-white/10 group-hover/link:bg-white/15"
                          : "bg-black/5 group-hover/link:bg-black/10"
                        }`}
                    >
                      <div className="text-[14px] leading-relaxed wrap-break-word font-medium">
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
            )
          ) : (
            <div className="px-3 py-2">{text}</div>
          )}
        </div>
      )}
    </MessageLayout>
  );
};
