import React, { useState } from "react";
import { ArrowLeft, UserPlus, Crown, MoreHorizontal, UserCheck, X, Loader2 } from "lucide-react";
import Avatar from "../../common/Avatar";
import { ConfirmModal } from "../../modal/ConfirmModal";
import type { MembersFullViewProps } from "../../../interfaces";
import { getFullUrl } from "../../../utils";
import { acceptFriendRequestViaChat } from "../../../services/social.service";
import { useToast } from "../../../contexts/ToastContext";

const MembersFullView: React.FC<MembersFullViewProps> = ({
  members,
  ownerId,
  currentUserId,
  isManager,
  friendIds,
  onBack,
  onMemberRemoved,
  onMemberRoleUpdated,
  onTransferOwnership,
  onAddMember,
  onAddFriend,
  pendingFriendRequestIds,
  sentFriendRequestIds,
  onFriendAccepted,
}) => {
  // Only show members who have joined (not invited)
  const validMembers = (members || []).filter(member =>
    member && member.user_id && member.status !== "invited"
  );
  const [menuOpenForUserId, setMenuOpenForUserId] = useState<string | null>(null);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{ id: string; name: string } | null>(null);
  const [acceptingFriendId, setAcceptingFriendId] = useState<string | null>(null);
  const { showToast } = useToast();

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
    if (!isManager) return false;
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
      <div className="px-4 py-3">
        <button
          onClick={onAddMember}
          className="flex cursor-pointer items-center justify-center gap-2 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-sm shadow-primary-500/20"
        >
          <UserPlus size={18} />
          <span className="text-sm font-semibold">Thêm thành viên</span>
        </button>
      </div>

      {/* Members Count Header */}
      <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/30">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Danh sách thành viên • {validMembers.length}
        </h4>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-2 py-1">
          {validMembers.map((member) => {
            const isMe = member.user_id === currentUserId;
            const isFriend = friendIds.has(member.user_id);

            return (
              <div
                key={member.user_id}
                className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Avatar
                  src={getFullUrl(member.avatar || "")}
                  name={getDisplayName(member)}
                  size={48}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {getDisplayName(member)}
                      {isMe && <span className="text-primary-600 ml-1">(Bạn)</span>}
                    </p>
                    {(member.role === "admin" || member.user_id === ownerId) && (
                      <Crown size={14} className="text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${member.user_id === ownerId ? "bg-amber-100 text-amber-700" :
                      member.role === "admin" ? "bg-blue-100 text-blue-700" :
                        member.status === "invited" ? "bg-orange-100 text-orange-600 border border-orange-200" :
                          "bg-gray-100 text-gray-600"
                      }`}>
                      {member.status === "invited" ? "Lời mời" : getRoleLabel(member)}
                    </span>
                    {member.status === "invited" && (
                      <span className="text-[10px] text-orange-500 font-medium italic">
                        • Đang chờ...
                      </span>
                    )}
                    {member.joined_at && member.status !== "invited" && (
                      <span className="text-[11px] text-gray-400">
                        • {new Date(member.joined_at).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Add Friend / Accept Friend Request Button */}
                  {!isMe && !isFriend && (
                    pendingFriendRequestIds?.has(member.user_id) ? (
                      <button
                        onClick={async () => {
                          setAcceptingFriendId(member.user_id);
                          try {
                            if (onFriendAccepted) {
                              await onFriendAccepted(member.user_id);
                            }
                            showToast("Đã chấp nhận lời mời kết bạn", "success");
                          } catch {
                            showToast("Không thể chấp nhận lời mời", "error");
                          } finally {
                            setAcceptingFriendId(null);
                          }
                        }}
                        disabled={acceptingFriendId === member.user_id}
                        className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        title="Chấp nhận lời mời kết bạn"
                      >
                        <UserCheck size={14} />
                        <span>Đồng ý</span>
                      </button>
                    ) : sentFriendRequestIds?.has(member.user_id) ? (
                      <div className="px-2.5 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-xs font-semibold flex items-center gap-1.5" title="Đã gửi lời mời kết bạn">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Đã mời</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddFriend(member.user_id)}
                        className="cursor-pointer p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Thêm bạn bè"
                      >
                        <UserPlus size={18} />
                      </button>
                    )
                  )}
                  {isFriend && !isMe && (
                    <div className="w-9" /> // Spacer for alignment
                  )}

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
                          {currentUserId === ownerId && (
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
                          )}

                          {currentUserId === ownerId && onTransferOwnership && (
                            <button
                              onClick={() => {
                                setTransferTarget({
                                  id: member.user_id,
                                  name: getDisplayName(member),
                                });
                                setTransferConfirmOpen(true);
                                setMenuOpenForUserId(null);
                              }}
                              className="w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Chuyển quyền trưởng nhóm
                            </button>
                          )}

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
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={transferConfirmOpen}
        title="Chuyển quyền trưởng nhóm"
        message={`Bạn có chắc chắn muốn chuyển quyền trưởng nhóm cho ${transferTarget?.name}? Người được chọn sẽ trở thành trưởng nhóm và có mọi quyền quản lý nhóm. Bạn sẽ mất quyền quản lý nhưng vẫn là một thành viên của nhóm. Hành động này không thể phục hồi.`}
        confirmText="Chuyển ngay"
        cancelText="Huỷ"
        isDangerous={true}
        onConfirm={() => {
          if (transferTarget && onTransferOwnership) {
            onTransferOwnership(transferTarget.id);
          }
          setTransferConfirmOpen(false);
          setTransferTarget(null);
        }}
        onCancel={() => {
          setTransferConfirmOpen(false);
          setTransferTarget(null);
        }}
      />
    </div>
  );
};

export default MembersFullView;