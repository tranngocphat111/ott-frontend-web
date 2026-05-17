import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserPlus,
  Crown,
  MoreHorizontal,
  UserCheck,
  Loader2,
  ShieldAlert,
  UserX,
  UserMinus,
} from "lucide-react";
import Avatar from "../../common/Avatar";
import { ConfirmModal } from "../../modal/ConfirmModal";
import type { MembersFullViewProps } from "../../../interfaces";
import { getFullUrl } from "../../../utils";
import { useToast } from "../../../contexts/ToastContext";
import { ConversationService } from "../../../services/conversation.service";

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
  onMemberBlocked,
  conversationId,
}) => {
  const [activeTab, setActiveTab] = useState<"members" | "blocked">("members");
  const [blockedMembers, setBlockedMembers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [menuOpenForUserId, setMenuOpenForUserId] = useState<string | null>(
    null,
  );
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [acceptingFriendId, setAcceptingFriendId] = useState<string | null>(
    null,
  );
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  const validMembers = (members || []).filter(
    (member) => member && member.user_id,
  );

  const fetchBlockedMembers = async () => {
    if (!conversationId || !currentUserId) return;
    setLoadingBlocked(true);
    try {
      const data = await ConversationService.getBlockedMembers(
        conversationId,
        currentUserId,
      );
      setBlockedMembers(data || []);
    } catch (err) {
      console.error("Failed to fetch blocked members:", err);
      showToast("Không thể tải danh sách bị chặn", "error");
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    if (activeTab === "blocked") {
      fetchBlockedMembers();
    }
  }, [activeTab, conversationId]);

  const handleBlockMember = async (userId: string) => {
    try {
      setBlockingUserId(userId);
      await ConversationService.blockMember(
        conversationId,
        userId,
        currentUserId,
      );
      showToast("Đã chặn thành viên khỏi nhóm", "success");
      if (onMemberBlocked) onMemberBlocked(userId);
      setMenuOpenForUserId(null);
    } catch (err: any) {
      showToast(err.message || "Không thể chặn thành viên", "error");
    } finally {
      setBlockingUserId(null);
    }
  };

  const handleUnblockMember = async (userId: string) => {
    try {
      await ConversationService.unblockMember(
        conversationId,
        userId,
        currentUserId,
      );
      showToast("Đã bỏ chặn thành viên", "success");
      setBlockedMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err: any) {
      showToast(err.message || "Không thể bỏ chặn", "error");
    }
  };

  const getDisplayName = (member: any) => {
    return (
      (member.nickname || "").trim() ||
      member.name ||
      `User ${member.user_id.slice(-4)}`
    );
  };

  const getRoleLabel = (member: any) => {
    if (member.user_id === ownerId) return "Trưởng nhóm";
    if (member.role === "admin") return "Phó nhóm";
    return "";
  };

  const canManageMember = (member: any) => {
    if (!isManager) return false;
    if (member.user_id === currentUserId) return false;
    if (member.user_id === ownerId) return false;
    return true;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
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

      {/* Tabs */}
      {isManager && (
        <div className="flex px-4 border-b border-gray-100 bg-white shrink-0">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === "members" ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Thành viên ({validMembers.length})
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === "blocked" ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            Đã chặn
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="shrink-0 bg-white">
        {activeTab === "members" ? (
          <div className="px-4 py-3 border-b border-gray-50">
            <button
              onClick={onAddMember}
              className="flex cursor-pointer items-center justify-center gap-2 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-sm shadow-primary-500/20"
            >
              <UserPlus size={18} />
              <span className="text-sm font-semibold">Thêm thành viên</span>
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/30">
            <div className="flex items-center gap-2 text-amber-600">
              <ShieldAlert size={16} />
              <p className="text-xs font-semibold uppercase tracking-wider">
                Danh sách chặn
              </p>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              Người bị chặn không thể vào nhóm qua link mời.
            </p>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "members" ? (
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
                        {isMe && (
                          <span className="text-primary-600 ml-1">(Bạn)</span>
                        )}
                      </p>
                      {(member.role === "admin" ||
                        member.user_id === ownerId) && (
                        <Crown size={14} className="text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleLabel(member) && (
                        <span
                          className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                            member.user_id === ownerId
                              ? "bg-amber-100 text-amber-700"
                              : member.role === "admin"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {getRoleLabel(member)}
                        </span>
                      )}

                      {member.joined_at && (
                        <span className="text-[11px] text-gray-400">
                          {" "}
                          {new Date(member.joined_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!isMe &&
                      !isFriend &&
                      (pendingFriendRequestIds?.has(member.user_id) ? (
                        <button
                          onClick={async () => {
                            setAcceptingFriendId(member.user_id);
                            try {
                              if (onFriendAccepted)
                                await onFriendAccepted(member.user_id);
                              showToast("Đã chấp nhận lời mời", "success");
                            } catch {
                              showToast("Lỗi khi chấp nhận", "error");
                            } finally {
                              setAcceptingFriendId(null);
                            }
                          }}
                          disabled={acceptingFriendId === member.user_id}
                          className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          <UserCheck size={14} />
                          <span>Đồng ý</span>
                        </button>
                      ) : sentFriendRequestIds?.has(member.user_id) ? (
                        <div className="px-2.5 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                          <Loader2 size={14} className="animate-spin" />
                          <span>Đã mời</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddFriend(member.user_id)}
                          className="cursor-pointer p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <UserPlus size={18} />
                        </button>
                      ))}

                    {canManageMember(member) && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setMenuOpenForUserId((prev) =>
                              prev === member.user_id ? null : member.user_id,
                            )
                          }
                          className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
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

                            {currentUserId === ownerId &&
                              onTransferOwnership && (
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
                              onClick={() => handleBlockMember(member.user_id)}
                              disabled={blockingUserId === member.user_id}
                              className="w-full cursor-pointer px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                            >
                              {blockingUserId === member.user_id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserX size={14} />
                              )}
                              Chặn khỏi nhóm
                            </button>

                            <button
                              onClick={() => {
                                onMemberRemoved(member.user_id);
                                setMenuOpenForUserId(null);
                              }}
                              className="w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <UserMinus size={14} />
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
        ) : (
          <div className="px-2 py-1">
            {loadingBlocked ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                <Loader2 size={32} className="animate-spin text-primary-500" />
                <p className="text-sm font-medium">Đang tải...</p>
              </div>
            ) : blockedMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                <div className="p-4 bg-gray-50 rounded-full">
                  <UserCheck size={32} />
                </div>
                <p className="text-sm font-medium">Trống</p>
              </div>
            ) : (
              blockedMembers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Avatar
                    src={getFullUrl(user.avatar || "")}
                    name={user.name || "User"}
                    size={48}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-gray-400">Đã bị chặn</p>
                  </div>
                  <button
                    onClick={() => handleUnblockMember(user.user_id)}
                    className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Bỏ chặn
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={transferConfirmOpen}
        title="Chuyển quyền trưởng nhóm"
        message={`Bạn có chắc chắn muốn chuyển quyền trưởng nhóm cho ${transferTarget?.name}?`}
        confirmText="Chuyển ngay"
        cancelText="Huỷ"
        isDangerous={true}
        onConfirm={() => {
          if (transferTarget && onTransferOwnership)
            onTransferOwnership(transferTarget.id);
          setTransferConfirmOpen(false);
        }}
        onCancel={() => setTransferConfirmOpen(false)}
      />
    </div>
  );
};

export default MembersFullView;
