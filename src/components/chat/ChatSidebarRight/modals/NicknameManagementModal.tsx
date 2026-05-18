import React, { useCallback, useMemo, useState } from "react";
import { Check, Loader2, PencilLine, Search, X } from "lucide-react";
import Avatar from "../../../common/Avatar";
import type { ConversationMember } from "../../../../interfaces";

export interface NicknameManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ConversationMember[];
  currentUserId: string;
  onNicknameUpdate: (userId: string, nickname: string) => Promise<void>;
}

const getMemberRealName = (member: ConversationMember) =>
  (member.name || "").trim() || member.user_id;

const getMemberNickname = (member: ConversationMember) =>
  (member.nickname || "").trim();

const NicknameManagementModal: React.FC<NicknameManagementModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUserId,
  onNicknameUpdate,
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validMembers = useMemo(
    () => {
      const normalizedCurrentUserId = String(currentUserId || "");

      return (members || [])
        .filter((member) => member && member.user_id)
        .sort((left, right) => {
          const leftIsCurrent =
            String(left.user_id) === normalizedCurrentUserId;
          const rightIsCurrent =
            String(right.user_id) === normalizedCurrentUserId;

          if (leftIsCurrent === rightIsCurrent) return 0;
          return leftIsCurrent ? -1 : 1;
        });
    },
    [currentUserId, members],
  );

  const filteredMembers = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return validMembers;

    return validMembers.filter((member) => {
      const realName = getMemberRealName(member).toLowerCase();
      const nickname = getMemberNickname(member).toLowerCase();
      const selfLabel =
        String(member.user_id) === String(currentUserId) ? "bạn ban you" : "";
      return (
        realName.includes(query) ||
        nickname.includes(query) ||
        selfLabel.includes(query)
      );
    });
  }, [currentUserId, searchText, validMembers]);

  const editingMember = validMembers.find(
    (member) => member.user_id === editingUserId,
  );
  const editingOriginalNickname = editingMember
    ? getMemberNickname(editingMember)
    : "";
  const isNicknameUnchanged =
    editingNickname.trim() === editingOriginalNickname;

  const getDisplayName = useCallback((member: ConversationMember) => {
    return getMemberNickname(member) || getMemberRealName(member);
  }, []);

  const handleEditClick = useCallback((member: ConversationMember) => {
    setEditingUserId(member.user_id);
    setEditingNickname(getMemberNickname(member));
    setError(null);
  }, []);

  const handleSaveNickname = async () => {
    if (!editingUserId) return;

    setLoading(true);
    setError(null);
    try {
      await onNicknameUpdate(editingUserId, editingNickname.trim());
      setEditingUserId(null);
      setEditingNickname("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Không thể cập nhật biệt danh";
      setError(errorMessage);
      console.error("Error updating nickname:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setEditingNickname("");
    setError(null);
  };

  const handleEditorKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Escape") {
      handleCancel();
      return;
    }

    if (event.key === "Enter" && !loading && !isNicknameUnchanged) {
      void handleSaveNickname();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3  sm:p-6">
      <div
        className="flex max-h-[min(760px,calc(100vh-2rem))] w-full max-w-[540px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold leading-7 text-slate-950">
                Biệt danh
              </h2>
              <p className="mt-0.5 text-[13px] leading-5 text-slate-500">
                {validMembers.length} thành viên có thể đặt biệt danh
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              title="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-4 flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:border-primary-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary-100/60">
            <Search size={18} />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Tìm thành viên hoặc biệt danh"
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
                title="Xóa tìm kiếm"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          {validMembers.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center px-6 text-center">
              <p className="text-[14px] leading-6 text-slate-500">
                Không có thành viên để đặt biệt danh
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center px-6 text-center">
              <p className="text-[14px] leading-6 text-slate-500">
                Không tìm thấy thành viên phù hợp
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => {
                const realName = getMemberRealName(member);
                const nickname = getMemberNickname(member);
                const isEditing = editingUserId === member.user_id;
                const isCurrentMember =
                  String(member.user_id) === String(currentUserId);
                const targetLabel = isCurrentMember ? "bạn" : realName;

                if (isEditing) {
                  return (
                    <div
                      key={member.user_id}
                      className="rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={member.avatar}
                          name={getDisplayName(member)}
                          size={44}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-[15px] font-semibold text-slate-950">
                              {realName}
                            </p>
                            {isCurrentMember && (
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                Bạn
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[12px] text-slate-500">
                            {nickname ? `Hiện tại: ${nickname}` : "Chưa có biệt danh"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-primary-300 focus-within:bg-white">
                        <input
                          type="text"
                          value={editingNickname}
                          onChange={(event) =>
                            setEditingNickname(event.target.value.slice(0, 50))
                          }
                          onKeyDown={handleEditorKeyDown}
                          disabled={loading}
                          autoFocus
                          placeholder={`Biệt danh cho ${targetLabel}`}
                          className="w-full bg-transparent text-[14px] font-medium text-slate-950 outline-none placeholder:text-slate-400 disabled:opacity-60"
                        />
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <span className="text-[11px] text-slate-400">
                            Để trống rồi lưu để xóa biệt danh
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            {editingNickname.length}/50
                          </span>
                        </div>
                      </div>

                      {error && (
                        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">
                          {error}
                        </p>
                      )}

                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancel}
                          disabled={loading}
                          className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-[13px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveNickname}
                          disabled={loading || isNicknameUnchanged}
                          className="inline-flex h-8 min-w-20 items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          {loading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Lưu
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={member.user_id}
                    className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition-colors hover:border-slate-200 hover:bg-slate-50"
                  >
                    <Avatar
                      src={member.avatar}
                      name={getDisplayName(member)}
                      size={44}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-[15px] font-semibold text-slate-950">
                          {getDisplayName(member)}
                        </p>
                        {isCurrentMember && (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            Bạn
                          </span>
                        )}
                        {nickname && (
                          <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                            Biệt danh
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-slate-500">
                        {nickname ? `Tên thật: ${realName}` : "Chưa có biệt danh"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleEditClick(member)}
                      disabled={loading}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white hover:text-primary-700 disabled:opacity-50 group-hover:bg-white"
                      title={nickname ? "Sửa biệt danh" : "Đặt biệt danh"}
                    >
                      <PencilLine size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NicknameManagementModal;
