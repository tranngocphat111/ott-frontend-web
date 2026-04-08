import React from "react";
import { Trash2, LogOut, AlertTriangle } from "lucide-react";
import { ConversationService, ParticipantService } from "../../../../services";
import type { GroupActionsProps } from "../../../../interfaces";
import { ConfirmModal } from "../../../modal/ConfirmModal";

const GroupActions: React.FC<GroupActionsProps> = ({
  conversation,
  currentUserId,
  isOwner = false,
  onLeaveSuccess,
  onActionSuccess,
}) => {
  const [confirmState, setConfirmState] = React.useState<{
    isOpen: boolean;
    action: "delete-history" | "leave-group" | "dissolve-group" | null;
  }>({
    isOpen: false,
    action: null,
  });

  const handleDeleteHistory = async () => {
    try {
      await ParticipantService.deleteConversation(conversation._id, currentUserId);
      await onActionSuccess?.();
      onLeaveSuccess();
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await ParticipantService.leaveGroup(conversation._id, currentUserId);
      await onActionSuccess?.();
      onLeaveSuccess();
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const handleDissolveGroup = async () => {
    try {
      await ConversationService.dissolveGroup(conversation._id, currentUserId);
      await onActionSuccess?.();
      onLeaveSuccess();
    } catch (error) {
      console.error("Error dissolving group:", error);
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
    }
  };

  const isGroupChat = conversation.type === "group";

  return (
    <div className="border-t border-gray-100 px-4 py-4 space-y-2">
      <button
        onClick={() =>
          setConfirmState({ isOpen: true, action: "delete-history" })
        }
        className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={18} />
        <span>Xoá lịch sử trò chuyện</span>
      </button>

      {isGroupChat && (
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

      {isGroupChat && isOwner && (
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

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={
          confirmState.action === "dissolve-group"
            ? "Giải tán nhóm"
            : confirmState.action === "leave-group"
              ? "Rời nhóm"
              : "Xóa lịch sử trò chuyện"
        }
        message={
          confirmState.action === "dissolve-group"
            ? "Nhóm sẽ bị xóa vĩnh viễn, toàn bộ tin nhắn và dữ liệu không thể khôi phục."
            : confirmState.action === "leave-group"
              ? "Bạn có chắc muốn rời khỏi nhóm này?"
              : "Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện phía bạn?"
        }
        confirmText={
          confirmState.action === "dissolve-group"
            ? "Giải tán nhóm"
            : confirmState.action === "leave-group"
              ? "Rời nhóm"
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