import React from "react";
import { Trash2, LogOut, AlertTriangle, UserRoundX } from "lucide-react";
import { ConversationService, ParticipantService } from "../../../../services";
import { unfriendViaChat, blockUserViaChat, unblockUserViaChat } from "../../../../services/social.service";
import type { GroupActionsProps } from "../../../../interfaces";
import { ConfirmModal } from "../../../modal/ConfirmModal";
import { useConversations } from "../../../../contexts/ConversationsContext";

const GroupActions: React.FC<GroupActionsProps> = ({
  conversation,
  currentUserId,
  isOwner = false,
  isDissolved = false,
  relationship,
  onUnfriend,
  onLeaveSuccess,
  onActionSuccess,
  onRelationshipChange,
}) => {
  const { refreshConversations } = useConversations();
  const [confirmState, setConfirmState] = React.useState<{
    isOpen: boolean;
    action: "delete-history" | "leave-group" | "dissolve-group" | "unfriend" | "block" | "unblock" | null;
  }>({
    isOpen: false,
    action: null,
  });

  const handleDeleteHistory = async () => {
    try {
      await ParticipantService.deleteConversation(conversation._id, currentUserId);

      // Dispatch event to remove from local session list immediately
      window.dispatchEvent(new CustomEvent("chat:remove-conversation", {
        detail: {
          conversationId: conversation._id,
          reason: "delete-history",
        }
      }));

      onLeaveSuccess();
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (isOwner) {
      alert("Bạn phải chuyển quyền trưởng nhóm trước khi rời nhóm.");
      return;
    }

    try {
      await ParticipantService.leaveGroup(conversation._id, currentUserId);
      onLeaveSuccess();
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const handleDissolveGroup = async () => {
    try {
      await ConversationService.dissolveGroup(conversation._id, currentUserId);
      // For owner, remove immediately from local state
      if (isOwner) {
        window.dispatchEvent(new CustomEvent("chat:remove-conversation", {
          detail: {
            conversationId: conversation._id,
            reason: "dissolve-group",
            keepOutOfList: true,
          }
        }));
      }
      onLeaveSuccess();
    } catch (error) {
      console.error("Error dissolving group:", error);
    }
  };

  const handleUnfriend = async () => {
    try {
      const otherId = conversation.participants?.find(p => String(p.user_id) !== String(currentUserId))?.user_id;
      if (!otherId) return;

      const success = await unfriendViaChat(currentUserId, otherId);
      if (success) {
        if (onUnfriend) onUnfriend();
        if (onActionSuccess) await onActionSuccess();
      }
    } catch (error) {
      console.error("Error unfriending:", error);
    }
  };

  const handleBlock = async () => {
    try {
      const otherId = conversation.participants?.find(p => String(p.user_id) !== String(currentUserId))?.user_id;
      if (!otherId) return;

      const result = await blockUserViaChat(currentUserId, otherId);
      if (result) {
        if (onRelationshipChange) onRelationshipChange(result);
        await refreshConversations(currentUserId);
        if (onActionSuccess) await onActionSuccess();
      }
    } catch (error) {
      console.error("Error blocking:", error);
    }
  };

  const handleUnblock = async () => {
    try {
      const otherId = conversation.participants?.find(p => String(p.user_id) !== String(currentUserId))?.user_id;
      if (!otherId) return;

      const result = await unblockUserViaChat(currentUserId, otherId);
      if (result) {
        if (onRelationshipChange) onRelationshipChange(result);
        await refreshConversations(currentUserId);
        if (onActionSuccess) await onActionSuccess();
      }
    } catch (error) {
      console.error("Error unblocking:", error);
    }
  };

  const handleConfirmAction = async () => {
    const action = confirmState.action;
    setConfirmState({ isOpen: false, action: null });

    if (action === "delete-history") {
      await handleDeleteHistory();
      return;
    }

    if (action === "leave-group") {
      await handleLeaveGroup();
      return;
    }

    if (action === "dissolve-group") {
      await handleDissolveGroup();
      return;
    }

    if (action === "unfriend") {
      await handleUnfriend();
      return;
    }

    if (action === "block") {
      await handleBlock();
      return;
    }

    if (action === "unblock") {
      await handleUnblock();
    }
  };

  const isGroupChat = conversation.type === "group";

  const dangerItemClass =
    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] font-medium text-rose-500/85 transition-colors hover:bg-rose-50 hover:text-rose-600";
  const neutralItemClass =
    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] font-medium text-blue-600 transition-colors hover:bg-blue-50";

  return (
    <div className="px-5 py-3">
      <div className="mb-2 h-px bg-slate-100" />
      <div className="space-y-1">
        <button
          onClick={() =>
            setConfirmState({ isOpen: true, action: "delete-history" })
          }
          className={dangerItemClass}
        >
          <Trash2 size={16} strokeWidth={2} />
          <span>Xoá lịch sử trò chuyện</span>
        </button>

        {!isDissolved && isGroupChat && (
          <button
            onClick={() =>
              setConfirmState({ isOpen: true, action: "leave-group" })
            }
            className={dangerItemClass}
          >
            <LogOut size={16} strokeWidth={2} />
            <span>Rời nhóm</span>
          </button>
        )}

        {!isDissolved && isGroupChat && isOwner && (
          <button
            onClick={() =>
              setConfirmState({ isOpen: true, action: "dissolve-group" })
            }
            className={dangerItemClass}
          >
            <AlertTriangle size={16} strokeWidth={2} />
            <span>Giải tán nhóm</span>
          </button>
        )}

        {!isGroupChat && (relationship as any)?.status === "ACCEPTED" && (
          <button
            onClick={() =>
              setConfirmState({ isOpen: true, action: "unfriend" })
            }
            className={dangerItemClass}
          >
            <UserRoundX size={16} strokeWidth={2} />
            <span>Hủy kết bạn</span>
          </button>
        )}

        {!isGroupChat && (relationship as any)?.status === "BLOCKED" && ((relationship as any)?.requester_id === currentUserId || (relationship as any)?.requesterId === currentUserId || (relationship as any)?.actorId === currentUserId) && (
          <button
            onClick={() =>
              setConfirmState({ isOpen: true, action: "unblock" })
            }
            className={neutralItemClass}
          >
            <UserRoundX size={16} strokeWidth={2} />
            <span>Bỏ chặn</span>
          </button>
        )}

        {!isGroupChat && (relationship as any)?.status !== "BLOCKED" && (
          <button
            onClick={() =>
              setConfirmState({ isOpen: true, action: "block" })
            }
            className={dangerItemClass}
          >
            <UserRoundX size={16} strokeWidth={2} />
            <span>Chặn người dùng</span>
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={
          confirmState.action === "dissolve-group"
            ? "Giải tán nhóm"
            : confirmState.action === "leave-group"
              ? "Rời nhóm"
              : confirmState.action === "unfriend"
                ? "Hủy kết bạn"
                : confirmState.action === "block"
                  ? "Chặn người dùng"
                  : confirmState.action === "unblock"
                    ? "Bỏ chặn"
                    : "Xóa lịch sử trò chuyện"
        }
        message={
          confirmState.action === "dissolve-group"
            ? "Nhóm sẽ bị xóa vĩnh viễn, toàn bộ tin nhắn và dữ liệu không thể khôi phục."
            : confirmState.action === "leave-group"
              ? "Bạn có chắc muốn rời khỏi nhóm này?"
              : confirmState.action === "unfriend"
                ? "Bạn có chắc chắn muốn hủy kết bạn với người này?"
                : confirmState.action === "block"
                  ? "Bạn có chắc chắn muốn chặn người dùng này? Họ sẽ không thể nhắn tin cho bạn và ngược lại."
                  : confirmState.action === "unblock"
                    ? "Bạn có chắc chắn muốn bỏ chặn người dùng này?"
                    : "Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện phía bạn?"
        }
        confirmText={
          confirmState.action === "dissolve-group"
            ? "Giải tán nhóm"
            : confirmState.action === "leave-group"
              ? "Rời nhóm"
              : confirmState.action === "unfriend"
                ? "Hủy kết bạn"
                : confirmState.action === "block"
                  ? "Chặn"
                  : confirmState.action === "unblock"
                    ? "Bỏ chặn"
                    : "Xóa"
        }
        cancelText="Hủy"
        isDangerous={true}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmState({ isOpen: false, action: null })}
      />
    </div>
  );
};

export default GroupActions;
