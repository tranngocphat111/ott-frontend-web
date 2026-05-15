import React, { useEffect, useMemo, useState } from "react";
import { Check, Search, Users, Video, X } from "lucide-react";
import Avatar from "../../common/Avatar";
import { ParticipantService } from "../../../services/participant.service";

interface GroupCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (selectedUserIds: string[]) => void;
  conversationId: string;
  currentUserId: string;
}

interface Member {
  user_id: string;
  user: {
    name: string;
    avatar: string;
  } | null;
}

const MAX_GROUP_CALL_INVITEES = 7;

const GroupCallModal: React.FC<GroupCallModalProps> = ({
  isOpen,
  onClose,
  onStart,
  conversationId,
  currentUserId,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitHint, setShowLimitHint] = useState(false);

  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const loadMembers = async () => {
      setSearchQuery("");
      setShowLimitHint(false);
      setIsLoading(true);
      try {
        const data = await ParticipantService.getConversationMembers(conversationId);
        const otherMembers = data.filter(
          (member: Member) => String(member.user_id) !== String(currentUserId),
        );

        setMembers(otherMembers);
        setSelectedIds(
          otherMembers
            .slice(0, MAX_GROUP_CALL_INVITEES)
            .map((member: Member) => member.user_id),
        );
      } catch (error) {
        console.error("Lỗi khi tải thành viên nhóm:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadMembers();
  }, [conversationId, currentUserId, isOpen]);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return members;

    return members.filter((member) =>
      (member.user?.name || "Người dùng")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [members, searchQuery]);

  const selectedMembers = useMemo(
    () => members.filter((member) => selectedIds.includes(member.user_id)),
    [members, selectedIds],
  );

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(userId)) {
        setShowLimitHint(false);
        return prev.filter((id) => id !== userId);
      }

      if (prev.length >= MAX_GROUP_CALL_INVITEES) {
        setShowLimitHint(true);
        return prev;
      }

      setShowLimitHint(false);
      return [...prev, userId];
    });
  };

  const handleSelectLimit = () => {
    setSelectedIds(
      filteredMembers
        .slice(0, MAX_GROUP_CALL_INVITEES)
        .map((member) => member.user_id),
    );
    setShowLimitHint(filteredMembers.length > MAX_GROUP_CALL_INVITEES);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setShowLimitHint(false);
  };

  const canStartCall =
    selectedIds.length > 0 && selectedIds.length <= MAX_GROUP_CALL_INVITEES;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-950/45  transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-in slide-in-from-bottom-4 duration-200 sm:max-h-[760px] sm:max-w-[520px] sm:rounded-2xl sm:zoom-in-95">
        <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-600">
                <Users size={14} />
                Tối đa {MAX_GROUP_CALL_INVITEES} người
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Bắt đầu cuộc gọi nhóm
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              title="Đóng"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="space-y-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm thành viên..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowLimitHint(false);
              }}
            />
          </div>


          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">
              Đã chọn{" "}
              <span className="font-bold text-primary-700">
                {selectedIds.length}/{MAX_GROUP_CALL_INVITEES}
              </span>
            </span>
            <button
              type="button"
              onClick={selectedIds.length > 0 ? clearSelection : handleSelectLimit}
              className="font-semibold text-primary-700 transition-colors hover:text-primary-900"
            >
              {selectedIds.length > 0 ? "Bỏ chọn tất cả" : "Chọn tối đa 7"}
            </button>
          </div>

          {selectedMembers.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {selectedMembers.map((member) => (
                <button
                  key={member.user_id}
                  type="button"
                  onClick={() => toggleSelect(member.user_id)}
                  className="group relative shrink-0 cursor-pointer"
                  title={`Bỏ chọn ${member.user?.name || "Người dùng"}`}
                >
                  <Avatar
                    src={member.user?.avatar}
                    name={member.user?.name || "Người dùng"}
                    size={34}
                    className="ring-2 ring-primary-100"
                  />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-700 text-white ring-2 ring-white">
                    <X size={10} />
                  </span>
                </button>
              ))}
            </div>
          )}

          {showLimitHint && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Chỉ có thể chọn tối đa {MAX_GROUP_CALL_INVITEES} thành viên cho một cuộc gọi.
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 sm:px-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="h-9 w-9 rounded-full border-3 border-primary-100 border-t-primary-600 animate-spin" />
              <p className="text-sm text-slate-500">Đang tải thành viên...</p>
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="space-y-1">
              {filteredMembers.map((member) => {
                const isSelected = selectedIds.includes(member.user_id);
                const isDisabledByLimit =
                  !isSelected && selectedIds.length >= MAX_GROUP_CALL_INVITEES;

                return (
                  <button
                    key={member.user_id}
                    type="button"
                    onClick={() => toggleSelect(member.user_id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-primary-50 text-primary-900"
                        : isDisabledByLimit
                          ? "text-slate-400 hover:bg-slate-50"
                          : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={member.user?.avatar}
                        name={member.user?.name || "Người dùng"}
                        size={42}
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white transition-colors ${
                          isSelected
                            ? "bg-primary-600 text-white"
                            : "bg-white text-transparent ring-1 ring-slate-200"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {member.user?.name || "Người dùng"}
                    </span>
                    {isDisabledByLimit && (
                      <span className="text-xs font-medium text-slate-400">
                        Đầy
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-slate-500">
                Không tìm thấy thành viên nào
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white p-4 sm:px-6">
          <button
            type="button"
            onClick={() => onStart(selectedIds)}
            disabled={!canStartCall}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 text-sm font-bold text-white shadow-lg shadow-primary-700/20 transition-all hover:bg-primary-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Video size={18} />
            Bắt đầu cuộc gọi
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCallModal;
