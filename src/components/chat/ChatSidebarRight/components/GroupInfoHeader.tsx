import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { ConversationService } from "../../../../services";
import Avatar from "../../../common/Avatar";
import type { GroupInfoHeaderProps } from "../../../../interfaces";

const GroupInfoHeader: React.FC<GroupInfoHeaderProps> = ({
  conversation,
  memberCount,
  onUpdate,
  isAdmin,
}) => {
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [displayName, setDisplayName] = useState(conversation.name || "");
  const [newName, setNewName] = useState(conversation.name || "");

  useEffect(() => {
    setDisplayName(conversation.name || "");
    if (!showRenameModal) {
      setNewName(conversation.name || "");
    }
  }, [conversation.name, showRenameModal]);

  const handleSave = async () => {
    const nextName = newName.trim();

    if (nextName && nextName !== conversation.name) {
      try {
        await ConversationService.updateConversation(conversation._id, {
          name: nextName,
        });

        // Cập nhật ngay tại chỗ để user thấy tức thì
        setDisplayName(nextName);
        onUpdate({ name: nextName });
        setShowRenameModal(false);
      } catch (error) {
        console.error("Error updating conversation name:", error);
      }
    } else {
      setNewName(displayName);
      setShowRenameModal(false);
    }
  };

  const isGroupChat = conversation.type === "group";

  return (
    <div className="px-4 py-6 text-center border-b border-gray-100">
      <Avatar
        src={conversation.avatar}
        name={conversation.name}
        size={80}
        className="mx-auto mb-3"
      />

      <div className="flex items-center justify-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900">
          {displayName}
        </h3>
        {isGroupChat && isAdmin && (
          <button
            onClick={() => {
              setNewName(displayName || "");
              setShowRenameModal(true);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      {isGroupChat && (
        <p className="text-sm text-gray-500 mt-1">{memberCount} thành viên</p>
      )}

      {showRenameModal && (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-130 rounded-md bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4 text-left">
              <h4 className="text-[24px] font-semibold text-gray-800">Đổi tên nhóm</h4>
            </div>

            <div className="px-6 py-5">
              <div className="mb-4 flex items-center justify-center">
                <div className="relative h-24 w-24">
                  <div className="absolute left-1 top-1">
                    <Avatar src={conversation.avatar} name={displayName} size={56} />
                  </div>
                  <div className="absolute right-1 top-0 h-10 w-10 rounded-full border-2 border-white bg-gray-100" />
                  <div className="absolute bottom-0 left-0 h-10 w-10 rounded-full border-2 border-white bg-gray-100" />
                  <div className="absolute bottom-1 right-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[18px] font-semibold text-gray-600">
                    {memberCount}
                  </div>
                </div>
              </div>

              <p className="mb-4 text-center text-[18px] text-gray-700">
                Bạn có chắc chắn muốn đổi tên nhóm, khi xác nhận tên nhóm mới sẽ hiển thị với tất cả thành viên.
              </p>

              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-12 w-full rounded-md border border-blue-300 px-3 text-center text-[15px] text-gray-900 outline-none focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setNewName(displayName || "");
                    setShowRenameModal(false);
                  }}
                  className="rounded-md bg-gray-200 px-5 py-2 text-[16px] font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-md bg-blue-600 px-5 py-2 text-[16px] font-semibold text-white hover:bg-blue-700"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupInfoHeader;