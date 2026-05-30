import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  UserPlus,
  MoreHorizontal,
  UserCheck,
  Loader2,
  ShieldAlert,
  UserX,
  UserMinus,
  Search,
} from "lucide-react";
import Avatar from "../../common/Avatar";
import { ConfirmModal } from "../../modal/ConfirmModal";
import type { MembersFullViewProps } from "../../../interfaces";
import { getFullUrl, parseBackendDate } from "../../../utils";
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
  const [memberSearch, setMemberSearch] = useState("");
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

  const formatJoinedDate = (joinedAt?: string) => {
    if (!joinedAt) return "";

    const date = parseBackendDate(joinedAt);
    if (!date) return "";

    return date.toLocaleDateString("vi-VN");
  };

  const canManageMember = (member: any) => {
    if (!isManager) return false;
    if (member.user_id === currentUserId) return false;
    if (member.user_id === ownerId) return false;
    return true;
  };

  const normalizedSearch = memberSearch.trim().toLocaleLowerCase("vi-VN");
  const filteredMembers = normalizedSearch
    ? validMembers.filter((member) =>
        getDisplayName(member).toLocaleLowerCase("vi-VN").includes(
          normalizedSearch,
        ),
      )
    : validMembers;
  const filteredBlockedMembers = normalizedSearch
    ? blockedMembers.filter((user) =>
        String(user.name || user.user_id || "")
          .toLocaleLowerCase("vi-VN")
          .includes(normalizedSearch),
      )
    : blockedMembers;
  const isSearching = normalizedSearch.length > 0;
  const activeCount =
    activeTab === "members" ? validMembers.length : blockedMembers.length;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="shrink-0 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <button
            onClick={onBack}
            aria-label="Quay lại"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold leading-6 text-slate-950">
              {activeTab === "members" ? "Thành viên" : "Đã chặn"}
            </h3>
            <p className="text-xs font-medium text-slate-500">
              {activeCount} {activeTab === "members" ? "thành viên" : "người"}
            </p>
          </div>
        </div>

        {isManager && (
          <div className="px-4 pb-3">
            <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab("members")}
                className={`h-8 cursor-pointer rounded-full text-sm font-semibold transition-all ${
                  activeTab === "members"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Thành viên
              </button>
              <button
                onClick={() => setActiveTab("blocked")}
                className={`h-8 cursor-pointer rounded-full text-sm font-semibold transition-all ${
                  activeTab === "blocked"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Đã chặn
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-3">
        {activeTab === "members" ? (
          <button
            onClick={onAddMember}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 text-[15px] font-semibold text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-100"
          >
            <UserPlus size={18} />
            <span>Thêm thành viên</span>
          </button>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} />
              <p className="text-sm font-semibold">Danh sách chặn</p>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Người bị chặn không thể vào nhóm qua link mời.
            </p>
          </div>
        )}

        <label className="relative mt-3 block">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={memberSearch}
            onChange={(event) => setMemberSearch(event.target.value)}
            placeholder={
              activeTab === "members" ? "Tìm thành viên" : "Tìm người bị chặn"
            }
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-primary-300 focus:bg-white"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {activeTab === "members" ? (
          filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-400">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <Search size={24} />
              </div>
              <p className="text-sm font-semibold">
                {isSearching ? "Không tìm thấy thành viên" : "Chưa có thành viên"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const isMe = member.user_id === currentUserId;
                const isFriend = friendIds.has(member.user_id);
                const roleLabel = getRoleLabel(member);
                const joinedDate = formatJoinedDate(member.joined_at);
                const isOwner = member.user_id === ownerId;

                return (
                  <div
                    key={member.user_id}
                    className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                  >
                    <Avatar
                      src={getFullUrl(member.avatar || "")}
                      name={getDisplayName(member)}
                      size={44}
                      className="ring-1 ring-slate-100"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-[15px] font-semibold leading-5 text-slate-950">
                          {getDisplayName(member)}
                          {isMe && (
                            <span className="ml-1 font-medium text-primary-600">
                              (Bạn)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs">
                        {roleLabel && (
                          <>
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                isOwner ? "bg-amber-500" : "bg-sky-500"
                              }`}
                            />
                            <span
                              className={`shrink-0 font-medium ${
                                isOwner ? "text-amber-700" : "text-sky-700"
                              }`}
                            >
                              {roleLabel}
                            </span>
                          </>
                        )}
                        {roleLabel && joinedDate && (
                          <span className="shrink-0 text-slate-300">•</span>
                        )}
                        {joinedDate && (
                          <span className="truncate font-medium text-slate-400">
                            {joinedDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-1 flex shrink-0 items-center justify-end gap-1">
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
                            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-primary-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                          >
                            {acceptingFriendId === member.user_id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <UserCheck size={14} />
                            )}
                            <span>Đồng ý</span>
                          </button>
                        ) : sentFriendRequestIds?.has(member.user_id) ? (
                          <div className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-500">
                            Đã mời
                          </div>
                        ) : (
                          <button
                            onClick={() => onAddFriend(member.user_id)}
                            aria-label="Thêm bạn"
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-primary-700 transition-colors hover:bg-primary-50"
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
                            aria-label="Tuỳ chọn thành viên"
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {menuOpenForUserId === member.user_id && (
                            <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
                              {currentUserId === ownerId && (
                                <button
                                  onClick={() => {
                                    onMemberRoleUpdated(
                                      member.user_id,
                                      member.role === "admin"
                                        ? "user"
                                        : "admin",
                                    );
                                    setMenuOpenForUserId(null);
                                  }}
                                  className="w-full cursor-pointer px-3.5 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
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
                                    className="w-full cursor-pointer px-3.5 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    Chuyển quyền trưởng nhóm
                                  </button>
                                )}

                              <button
                                onClick={() => handleBlockMember(member.user_id)}
                                disabled={blockingUserId === member.user_id}
                                className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-left text-sm font-medium text-amber-600 hover:bg-amber-50"
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
                                className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
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
          )
        ) : (
          <div className="divide-y divide-slate-100">
            {loadingBlocked ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-400">
                <Loader2 size={30} className="animate-spin text-primary-500" />
                <p className="text-sm font-semibold">Đang tải...</p>
              </div>
            ) : filteredBlockedMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-400">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <UserCheck size={24} />
                </div>
                <p className="text-sm font-semibold">
                  {isSearching ? "Không tìm thấy người bị chặn" : "Danh sách trống"}
                </p>
              </div>
            ) : (
              filteredBlockedMembers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <Avatar
                    src={getFullUrl(user.avatar || "")}
                    name={user.name || "User"}
                    size={44}
                    className="ring-1 ring-slate-100"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold leading-5 text-slate-950">
                      {user.name}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      Đã bị chặn
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnblockMember(user.user_id)}
                    className="h-8 cursor-pointer rounded-full px-3 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50"
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
