import React from "react";
import { Trash2, LogOut } from "lucide-react";
import { ParticipantService } from "../../../../services";
import type { GroupActionsProps } from "../../../../interfaces";

const GroupActions: React.FC<GroupActionsProps> = ({
  conversation,
  currentUserId,
  onLeaveSuccess,
}) => {
  const handleDeleteHistory = async () => {
    if (!confirm("Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện?")) return;

    try {
      await ParticipantService.deleteConversation(conversation._id, currentUserId);
      console.log("Deleted conversation history for:", conversation._id);
      
      // Optionally reload or notify parent to update
      if (onLeaveSuccess) {
        onLeaveSuccess(); // Close sidebar and refresh
      }
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Bạn có chắc muốn rời khỏi nhóm này?")) return;

    try {
      await ParticipantService.leaveGroup(conversation._id, currentUserId);
      if (onLeaveSuccess) {
        onLeaveSuccess();
      }
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const isGroupChat = conversation.type === "group";

  return (
    <div className="border-t border-gray-100 px-4 py-4 space-y-2">
      <button
        onClick={handleDeleteHistory}
        className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={18} />
        <span>Xoá lịch sử trò chuyện</span>
      </button>

      {isGroupChat && (
        <button
          onClick={handleLeaveGroup}
          className="w-full cursor-pointer flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Rời nhóm</span>
        </button>
      )}
    </div>
  );
};

export default GroupActions;