import React from "react";
import Avatar from "../../../common/Avatar";
import type { ConversationMember } from "../../../../interfaces";
import type { User } from "../../../../types";

interface GroupMembersListProps {
  members: ConversationMember[];
  conversationId: string;
  currentUserId: string;
  isAdmin: boolean;
  onMemberRemoved: (userId: string) => void;
  onRoleUpdated: (userId: string, newRole: "admin" | "user") => void;
  onViewAll: () => void;
}

const GroupMembersList: React.FC<GroupMembersListProps> = ({
  members,
  conversationId,
  currentUserId,
  isAdmin,
  onMemberRemoved,
  onRoleUpdated,
  onViewAll,
}) => {
  const validMembers = (members || []).filter(member => member && member.user_id);
  const displayedMembers = validMembers.slice(0, 6);
  const hasMoreMembers = validMembers.length > 6;

  const getDisplayName = (member: ConversationMember) =>
    (member.nickname || "").trim() ||
    (member.name || "").trim() ||
    `User ${member.user_id.slice(-4)}`;

  if (validMembers.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">Không có thành viên nào</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 mb-3">
        {displayedMembers.map((member) => (
          <div key={member.user_id} className="flex items-center gap-3">
            <Avatar 
              src={member.avatar || ""} 
              name={getDisplayName(member)} 
              size={32} 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 text-sm truncate">
                  {getDisplayName(member)}
                  {member.user_id === currentUserId && " (Bạn)"}
                </span>
                {member.role === "admin" && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                    Phó nhóm
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMoreMembers && (
        <button
          onClick={onViewAll}
          className="text-sm text-primary-600 hover:underline"
        >
          Xem thêm {validMembers.length - 6} thành viên khác
        </button>
      )}
    </div>
  );
};

export default GroupMembersList;