import React, { useState, useCallback } from "react";
import { X, Edit2 } from "lucide-react";
import Avatar from "../../../common/Avatar";
import type { ConversationMember } from "../../../../interfaces";

export interface NicknameManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ConversationMember[];
  currentUserId: string;
  onNicknameUpdate: (userId: string, nickname: string) => Promise<void>;
}

const NicknameManagementModal: React.FC<NicknameManagementModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUserId,
  onNicknameUpdate,
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validMembers = (members || []).filter(
    (member) => member && member.user_id && member.user_id !== currentUserId
  );

  const editingMember = validMembers.find((m) => m.user_id === editingUserId);

  const handleEditClick = useCallback((member: ConversationMember) => {
    setEditingUserId(member.user_id);
    setEditingNickname((member.nickname || "").trim());
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Biệt danh</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {validMembers.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-500">
                Không có thành viên để đặt biệt danh
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {validMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Member Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar
                      src={member.avatar}
                      name={member.name}
                      size={40}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(member.nickname || "").trim() || "Đặt biệt danh"}
                      </p>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditClick(member)}
                    disabled={loading}
                    className="cursor-pointer shrink-0 p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nickname Edit Modal */}
      {editingUserId && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Đặt biệt danh
              </h3>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="cursor-pointer p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {error && (
              <div className="px-6 py-2 bg-red-50 border-b border-red-200">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-3">
                {editingMember.name || editingMember.user_id}
              </p>
              <input
                type="text"
                placeholder="Nhập biệt danh (tối đa 50 ký tự)"
                value={editingNickname}
                onChange={(e) =>
                  setEditingNickname(e.target.value.slice(0, 50))
                }
                disabled={loading}
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="cursor-pointer px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNickname}
                disabled={loading}
                className="cursor-pointer px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NicknameManagementModal;
