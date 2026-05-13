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
        detail: { conversationId: conversation._id }
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
          detail: { conversationId: conversation._id }
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

  return (
    <div className="px-4 py-4 space-y-2">
      <div className="h-[1px] bg-slate-100 mx-1 mb-4" />
      <button
        onClick={() =>
          setConfirmState({ isOpen: true, action: "delete-history" })
        }
        className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={18} />
        <span>Xoá lịch sử trò chuyện</span>
      </button>

      {!isDissolved && isGroupChat && (
        <button
          onClick={() =>
            setConfirmState({ isOpen: true, action: "leave-group" })
          }
          className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Rời nhóm</span>
        </button>
      )}

      {!isDissolved && isGroupChat && isOwner && (
        <button
          onClick={() =>
            setConfirmState({ isOpen: true, action: "dissolve-group" })
          }
          className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <AlertTriangle size={18} />
          <span>Giải tán nhóm</span>
        </button>
      )}

      {!isGroupChat && (relationship as any)?.status === "ACCEPTED" && (
        <button
          onClick={() =>
            setConfirmState({ isOpen: true, action: "unfriend" })
          }
          className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <UserRoundX size={18} />
          <span>Hủy kết bạn</span>
        </button>
      )}

      {!isGroupChat && (relationship as any)?.status === "BLOCKED" && ((relationship as any)?.requester_id === currentUserId || (relationship as any)?.requesterId === currentUserId || (relationship as any)?.actorId === currentUserId) && (
        <button
          onClick={() =>
            setConfirmState({ isOpen: true, action: "unblock" })
          }
          className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <UserRoundX size={18} />
          <span>Bỏ chặn</span>
        </button>
      )}

      {!isGroupChat && (relationship as any)?.status !== "BLOCKED" && (
        <button
          onClick={() =>
            setConfirmState({ isOpen: true, action: "block" })
          }
          className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <UserRoundX size={18} />
          <span>Chặn người dùng</span>
        </button>
      )}

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