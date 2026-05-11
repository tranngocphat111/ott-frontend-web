import React, { useState, useEffect } from "react";
import { X, Search, Phone, Video } from "lucide-react";
import Avatar from "../../common/Avatar";
import { ParticipantService } from "../../../services/participant.service";
import type { CallType } from "../../../hooks/useCall";

interface GroupCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (selectedUserIds: string[], callType: CallType) => void;
  conversationId: string;
  initialCallType: CallType;
  currentUserId: string;
}

interface Member {
  user_id: string;
  user: {
    name: string;
    avatar: string;
  } | null;
}

const GroupCallModal: React.FC<GroupCallModalProps> = ({
  isOpen,
  onClose,
  onStart,
  conversationId,
  initialCallType,
  currentUserId,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callType, setCallType] = useState<CallType>(initialCallType);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadMembers();
    }
  }, [isOpen, conversationId]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await ParticipantService.getConversationMembers(conversationId);
      // Lọc bỏ bản thân khỏi danh sách chọn
      const otherMembers = data.filter((m: Member) => m.user_id !== currentUserId);
      setMembers(otherMembers);
      // Mặc định chọn tất cả giống Zalo
      setSelectedIds(otherMembers.map((m: Member) => m.user_id));
    } catch (error) {
      console.error("Lỗi khi tải thành viên nhóm:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredMembers = members.filter((m) =>
    m.user?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-primary-50/50">
          <h3 className="text-xl font-bold text-gray-800">Bắt đầu cuộc gọi nhóm</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Selection Info */}
        <div className="p-4 border-b border-gray-100 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm thành viên..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Đã chọn <span className="font-bold text-primary-600">{selectedIds.length}</span> thành viên
            </span>
            <button 
              onClick={() => setSelectedIds(selectedIds.length === members.length ? [] : members.map(m => m.user_id))}
              className="text-primary-600 font-semibold hover:underline"
            >
              {selectedIds.length === members.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto max-h-[400px] p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Đang tải thành viên...</p>
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="space-y-1">
              {filteredMembers.map((member) => (
                <div
                  key={member.user_id}
                  onClick={() => toggleSelect(member.user_id)}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={member.user?.avatar}
                      name={member.user?.name || "Member"}
                      size={44}
                    />
                    <div className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center transition-colors ${
                      selectedIds.includes(member.user_id) ? "bg-primary-500" : "bg-gray-200"
                    }`}>
                      {selectedIds.includes(member.user_id) && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                  <span className="flex-1 font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                    {member.user?.name || "Người dùng"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500 italic">Không tìm thấy thành viên nào</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
          <div className="flex-1 text-center py-2 bg-primary-50 rounded-xl border border-primary-100">
            <span className="text-sm font-bold text-primary-700 flex items-center justify-center gap-2">
              <Video size={18} />
              Chế độ gọi video nhóm
            </span>
          </div>

          <button
            onClick={() => onStart(selectedIds, "video")}
            disabled={selectedIds.length === 0}
            className="flex-[2] py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-95"
          >
            Bắt đầu cuộc gọi
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupCallModal;
