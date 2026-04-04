import React, { useState } from "react";
import { ArrowLeft, UserPlus, Crown, MoreHorizontal } from "lucide-react";
import Avatar from "../../common/Avatar";
import type { MembersFullViewProps } from "../../../interfaces";

const MembersFullView: React.FC<MembersFullViewProps> = ({
  members,
  ownerId,
  currentUserId,
  isOwner,
  onBack,
  onMemberRemoved,
  onMemberRoleUpdated,
  onAddMember,
}) => {
  const validMembers = (members || []).filter(member => member && member.user_id);
  const [menuOpenForUserId, setMenuOpenForUserId] = useState<string | null>(null);

  const getDisplayName = (member: (typeof validMembers)[number]) => {
    return (member.nickname || "").trim() || member.name || `User ${member.user_id.slice(-4)}`;
  };

  const getRoleLabel = (member: (typeof validMembers)[number]) => {
    if (member.user_id === ownerId) {
      return "Trưởng nhóm";
    }
    if (member.role === "admin") {
      return "Phó nhóm";
    }
    return "Thành viên";
  };

  const canManageMember = (member: (typeof validMembers)[number]) => {
    if (!isOwner) return false;
    if (member.user_id === currentUserId) return false;
    if (member.user_id === ownerId) return false;
    return true;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
        <button
          onClick={onBack}
          className="cursor-pointer p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 flex-1">
          Thành viên
        </h3>
      </div>

      {/* Add Member Button */}
      {isOwner && (
        <div className="px-4 py-2">
          <button
            onClick={onAddMember}
            className="flex cursor-pointer items-center justify-center gap-1.5 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <UserPlus size={15} className="text-gray-600" />
            <span className="text-[14px] font-medium text-gray-700">Thêm thành viên</span>
          </button>
        </div>
      )}

      {/* Members Count Header */}
      <div className="px-4 py-2">
        <h4 className="text-sm font-semibold text-gray-900">
          Danh sách thành viên ({validMembers.length})
        </h4>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          {validMembers.map((member) => (
            <div
              key={member.user_id}
              className="relative flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-b-0"
            >
              <Avatar 
                src={member.avatar || ""} 
                name={getDisplayName(member)} 
                size={48} 
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayName(member)}
                    {member.user_id === currentUserId && " (Bạn)"}
                  </p>
                  {(member.role === "admin" || member.user_id === ownerId) && (
                    <Crown size={14} className="text-amber-500" />
                  )}
                </div>
                {!!(member.nickname || "").trim() && (
                  <p className="text-[11px] text-amber-700">
                    Tên gốc: {member.name || member.user_id}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {getRoleLabel(member)}
                </p>
                {member.joined_at && (
                  <p className="text-[11px] text-gray-400">
                    Tham gia {new Date(member.joined_at).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </div>

              {canManageMember(member) && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setMenuOpenForUserId((prev) =>
                        prev === member.user_id ? null : member.user_id,
                      )
                    }
                    className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Tuỳ chọn thành viên"
                  >
                    <MoreHorizontal size={18} className="text-gray-600" />
                  </button>

                  {menuOpenForUserId === member.user_id && (
                    <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                      <button
                        onClick={() => {
                          onMemberRoleUpdated(
                            member.user_id,
                            member.role === "admin" ? "user" : "admin",
                          );
                          setMenuOpenForUserId(null);
                        }}
                        className="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {member.role === "admin"
                          ? "Gỡ phó nhóm"
                          : "Thêm phó nhóm"}
                      </button>

                      <button
                        onClick={() => {
                          onMemberRemoved(member.user_id);
                          setMenuOpenForUserId(null);
                        }}
                        className="w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        Xóa khỏi nhóm
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MembersFullView;