import React, { useMemo, useState } from "react";
import type { Message } from "../../../types/message.type";
import type { ConversationParticipant } from "../../../types/participant.type";
import { MessageService } from "../../../services";
import {
  BarChart3,
  Check,
  ChevronRight,
  Lock,
  Loader2,
  Users,
} from "lucide-react";

import { MessageLayout } from "./MessageLayout";
import { PollVoterDetailModal } from "./PollVoterDetailModal";
import { ConfirmModal } from "../../modal/ConfirmModal";

interface PollMessageProps {
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
  participants?: ConversationParticipant[];
  conversationType?: string;
}

export const PollMessage: React.FC<PollMessageProps> = ({
  msg,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  isTopBoundary,
  onPin,
  participants,
  conversationType,
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);
  const [locallyLocked, setLocallyLocked] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLockConfirmOpen, setIsLockConfirmOpen] = useState(false);
  const [noticeModal, setNoticeModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Fallback for missing properties
  const question = msg.poll_question || "Khảo sát";
  const options = useMemo(() => msg.poll_options || [], [msg.poll_options]);
  const totalVotes = options.reduce((sum, opt) => sum + (opt.voters?.length || 0), 0);
  const totalVoters = useMemo(() => {
    const voters = new Set<string>();
    options.forEach((opt) => {
      (opt.voters || []).forEach((voterId) => voters.add(String(voterId)));
    });
    return voters.size;
  }, [options]);
  const isLocked = locallyLocked || Boolean(msg.poll_locked);
  const canLockPoll =
    isMe &&
    !isLocked &&
    Boolean(msg.msg_id) &&
    Boolean(msg.conversation_id) &&
    Boolean(currentUserId);
  const modeLabel = msg.poll_multiple_choice ? "Chọn nhiều" : "Bình chọn một";

  const handleVote = async (optionId: string) => {
    if (
      isLocked ||
      isVoting ||
      !msg.msg_id ||
      !msg.conversation_id ||
      !currentUserId
    ) return;

    try {
      setIsVoting(true);
      setVotingOptionId(optionId);

      const isCurrentlySelected = options
        .find((opt) => opt.id === optionId)
        ?.voters?.some((voterId) => String(voterId) === String(currentUserId));

      // Compute new optionIds list based on multipleChoice
      let newOptionIds: string[] = [];
      if (msg.poll_multiple_choice) {
        // Collect currently selected options
        options.forEach(opt => {
          if (opt.voters?.some((voterId) => String(voterId) === String(currentUserId))) {
            newOptionIds.push(opt.id);
          }
        });

        // Toggle the clicked one
        if (isCurrentlySelected) {
          newOptionIds = newOptionIds.filter(id => id !== optionId);
        } else {
          newOptionIds.push(optionId);
        }
      } else {
        // Single choice, just toggle if clicked the same, otherwise select only the new one
        if (!isCurrentlySelected) {
          newOptionIds = [optionId];
        }
      }

      await MessageService.votePoll(
        msg.conversation_id,
        msg.msg_id,
        currentUserId,
        newOptionIds
      );

    } catch (error) {
      console.error("Error voting:", error);
      setNoticeModal({
        title: "Không thể gửi bình chọn",
        message:
          error instanceof Error
            ? error.message
            : "Không thể gửi bình chọn. Vui lòng thử lại.",
      });
    } finally {
      setIsVoting(false);
      setVotingOptionId(null);
    }
  };

  const handleLockPoll = async () => {
    if (!canLockPoll || isLocking || !msg.msg_id || !msg.conversation_id || !currentUserId) {
      return;
    }

    try {
      setIsLocking(true);
      await MessageService.lockPoll(msg.conversation_id, msg.msg_id, currentUserId);
      setLocallyLocked(true);
      window.dispatchEvent(
        new CustomEvent("chat:poll-updated", {
          detail: {
            ...msg,
            poll_locked: true,
            poll_locked_at: msg.poll_locked_at || new Date().toISOString(),
            poll_locked_by: currentUserId,
          },
        }),
      );
      setIsLockConfirmOpen(false);
    } catch (error) {
      console.error("Error locking poll:", error);
      setNoticeModal({
        title: "Không thể khóa bình chọn",
        message:
          error instanceof Error
            ? error.message
            : "Không thể khóa bình chọn. Vui lòng thử lại.",
      });
    } finally {
      setIsLocking(false);
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
        onPin={onPin}
        isCentered={true}
        hideAvatar={true}
        showActionsOnHover={false}
        participants={participants}
        conversationType={conversationType}
        onViewDetails={() => setIsDetailModalOpen(true)}
      >
        {() => (
          <div className="flex w-[min(380px,calc(100vw-48px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white font-body shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
                    <BarChart3 size={18} strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary-600">
                        Bình chọn
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {modeLabel}
                      </span>
                    </div>
                    <h4 className="mt-2 break-words text-[16px] font-bold leading-snug text-slate-900">
                      {question}
                    </h4>
                  </div>
                </div>

                {isLocked ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] font-semibold text-white">
                    <Lock size={14} />
                    Đã khóa
                  </span>
                ) : canLockPoll ? (
                  <button
                    type="button"
                    onClick={() => setIsLockConfirmOpen(true)}
                    disabled={isLocking}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60"
                    title="Khóa bình chọn"
                  >
                    {isLocking ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Lock size={14} />
                    )}
                    Khóa
                  </button>
                ) : null}
              </div>

              <div className="mt-3 flex items-center gap-3 text-[12px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Users size={13} />
                  {totalVoters} người tham gia
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{totalVotes} lượt chọn</span>
              </div>
            </div>

            <div className="flex max-h-[360px] flex-col gap-2.5 overflow-y-auto p-3 custom-scrollbar">
              {options.map((opt) => {
                const voteCount = opt.voters?.length || 0;
                const isSelected = opt.voters?.some(
                  (voterId) => String(voterId) === String(currentUserId),
                );
                const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                const isOptionBusy = isVoting && votingOptionId === opt.id;

                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => handleVote(opt.id)}
                    disabled={isLocked || isVoting || !currentUserId}
                    className={`group relative min-h-[58px] overflow-hidden rounded-xl border text-left transition-colors ${
                      isSelected
                        ? "border-primary-300 bg-primary-50"
                        : "border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50"
                    } ${
                      isLocked
                        ? "cursor-default opacity-90"
                        : "cursor-pointer active:scale-[0.99]"
                    } disabled:pointer-events-none`}
                  >
                    {percentage > 0 && (
                      <div
                        className={`pointer-events-none absolute inset-y-0 left-0 rounded-xl transition-all duration-500 ${
                          isSelected ? "bg-primary-100" : "bg-slate-100"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    <div className="relative z-10 flex items-center justify-between gap-3 px-3.5 py-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors ${
                            msg.poll_multiple_choice ? "rounded-md" : "rounded-full"
                          } ${
                            isSelected
                              ? "border-primary-600 bg-primary-600 text-white"
                              : "border-slate-300 bg-white text-transparent group-hover:border-primary-400"
                          }`}
                        >
                          {isSelected && <Check size={13} strokeWidth={3} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className={`block truncate text-[14px] font-semibold leading-5 ${
                            isSelected ? "text-slate-950" : "text-slate-800"
                          }`}>
                            {opt.name}
                          </span>
                          {voteCount > 0 && (
                            <span className="mt-0.5 block text-[12px] font-medium text-slate-500">
                              {voteCount} lượt chọn
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {isOptionBusy && (
                          <Loader2 size={14} className="animate-spin text-slate-400" />
                        )}
                        <span className="min-w-9 text-right text-[12px] font-bold tabular-nums text-slate-600">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
              <span className="truncate text-[12px] font-medium text-slate-500">
                {isLocked ? "Bình chọn đã khóa" : "Có thể thay đổi lựa chọn"}
              </span>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-semibold text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                onClick={() => setIsDetailModalOpen(true)}
              >
                Chi tiết
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </MessageLayout>

      <PollVoterDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        msg={msg}
        currentUserId={currentUserId}
      />

      <ConfirmModal
        isOpen={isLockConfirmOpen}
        title="Khóa bình chọn"
        message="Sau khi khóa, mọi người sẽ không thể bình chọn hoặc đổi lựa chọn nữa."
        confirmText={isLocking ? "Đang khóa..." : "Khóa"}
        cancelText="Hủy"
        onConfirm={handleLockPoll}
        onCancel={() => {
          if (isLocking) return;
          setIsLockConfirmOpen(false);
        }}
      />

      <ConfirmModal
        isOpen={!!noticeModal}
        title={noticeModal?.title || ""}
        message={noticeModal?.message || ""}
        confirmText="Đóng"
        hideCancelButton
        onConfirm={() => setNoticeModal(null)}
        onCancel={() => setNoticeModal(null)}
      />
    </>
  );
};
