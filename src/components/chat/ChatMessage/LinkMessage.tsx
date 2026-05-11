// src/components/Chat/ChatMessage/LinkMessage.tsx
import { useMemo, useState, useEffect } from "react";
import { Globe, ArrowUpRight, Link as LinkIcon, Loader2 } from "lucide-react";
import type { Message, Conversation } from "../../../types";
import { MessageLayout } from "./MessageLayout";
import { ConversationService } from "../../../services/conversation.service";
import { useToast } from "../../../contexts/ToastContext";

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

  const inviteToken = useMemo(() => {
    if (!isGroupInviteLink || !safeLink) return null;
    const url = new URL(safeLink);
    return url.searchParams.get("token");
  }, [isGroupInviteLink, safeLink]);

  const [groupInfo, setGroupInfo] = useState<{ conversation: Conversation; isMember: boolean } | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [joining, setJoining] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (inviteToken && isGroupInviteLink) {
      setLoadingGroup(true);
      ConversationService.getInviteLinkInfo(inviteToken, currentUserId)
        .then((data) => setGroupInfo(data))
        .catch(() => {}) // Ignore errors (e.g. invalid link)
        .finally(() => setLoadingGroup(false));
    }
  }, [inviteToken, isGroupInviteLink, currentUserId]);

  const handleLinkClick = (e: React.MouseEvent) => {
    if (isGroupInviteLink) {
      e.preventDefault();
      if (!groupInfo) {
         showToast("Link mời không hợp lệ hoặc đã hết hạn", "error");
         return;
      }
      if (groupInfo.isMember) {
        // Already in group, navigate directly
        window.dispatchEvent(
          new CustomEvent("chat:open-conversation", {
            detail: {
              conversationId: groupInfo.conversation._id,
              conversation: groupInfo.conversation,
            },
          })
        );
      } else {
        // Show confirm modal
        setShowConfirm(true);
      }
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteToken || !currentUserId || !groupInfo) return;
    setJoining(true);
    try {
      const { conversation } = await ConversationService.joinByInviteLink(inviteToken, currentUserId);
      setShowConfirm(false);
      showToast("Tham gia nhóm thành công!", "success");
      // Cập nhật state nội bộ
      setGroupInfo({ conversation, isMember: true });
      // Điều hướng tới nhóm
      window.dispatchEvent(
        new CustomEvent("chat:open-conversation", {
          detail: {
            conversationId: conversation._id,
            conversation,
          },
        })
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Không thể tham gia nhóm", "error");
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
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
            : "bg-chat-other text-chat-other-text border-chat-other-border"
            } ${borderRadius} ${isGroupInviteLink
              ? "max-w-[320px] bg-surface border-primary-200"
              : "max-w-[320px]"
            }`}
        >
          {safeLink ? (
            isGroupInviteLink ? (
              <a
                href={safeLink}
                onClick={handleLinkClick}
                className="block no-underline group/link cursor-pointer"
              >
                {/* Dùng màu primary-700 cho text link trên nền trắng */}
                <div className="px-3 pt-3 pb-2 break-all text-[13px] text-primary-700 underline opacity-80">
                  {safeLink}
                </div>

                <div className="mx-3 mb-3 border border-primary-100 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                  {/* Header Card: Sử dụng gradient primary từ theme của bạn */}
                  <div className="bg-primary-500 px-4 py-6 flex items-center gap-4 text-white relative overflow-hidden">
                    <div className="w-14 h-14 bg-white flex items-center justify-center shrink-0 rounded-full shadow-sm z-10">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center">
                        {loadingGroup ? (
                           <Loader2 size={24} className="text-primary-500 animate-spin" />
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="z-10 flex-1 min-w-0">
                      <div className="text-white/80 text-[13px] font-medium mb-0.5">Nhóm</div>
                      <div className="font-bold text-base leading-tight font-display truncate">
                        {loadingGroup ? "Đang tải..." : (groupInfo?.conversation?.name || "Link tham gia nhóm")}
                      </div>
                    </div>
                  </div>

                  {/* Footer Card: Text dùng tone primary đậm */}
                  <div className="px-3 py-2 bg-surface flex justify-between items-center">
                    <div>
                      <div className="text-[14px] font-semibold text-primary-900 mb-0.5 font-body">Tham gia nhóm chat</div>
                      <div className="text-[12px] text-primary-600 opacity-70">Bấm vào đây để tham gia nhóm</div>
                    </div>
                    {groupInfo?.isMember && (
                       <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full whitespace-nowrap">Đã tham gia</span>
                    )}
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
                      <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 truncate font-body">
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
                        ? "bg-white/20 group-hover/link:bg-white/30"
                        : "bg-primary-50 group-hover/link:bg-primary-100"
                        }`}
                    >
                      <div className="text-[14px] leading-relaxed wrap-break-word font-medium font-body">
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
            <div className="px-3 py-2 font-body">{text}</div>
          )}
        </div>
      )}
    </MessageLayout>
    {showConfirm && (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Tham gia nhóm</h3>
          <p className="text-gray-600 mb-6 text-sm">
            Bạn có muốn tham gia nhóm <span className="font-bold text-gray-900">{groupInfo?.conversation?.name}</span> không?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleJoinGroup}
              disabled={joining}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {joining ? <Loader2 size={16} className="animate-spin" /> : null}
              Tham gia
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};