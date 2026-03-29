import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { ConversationService } from "../../../../services";
import Avatar from "../../../common/Avatar";
import type { GroupInfoHeaderProps } from "../../../../interfaces";
import { getConversationDisplayAvatar, getConversationDisplayName } from "../../../../utils";

const GroupInfoHeader: React.FC<GroupInfoHeaderProps> = ({
  conversation,
  memberCount,
  onUpdate,
  isAdmin,
  currentUserId,
}) => {
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [displayName, setDisplayName] = useState(
    getConversationDisplayName(conversation, currentUserId),
  );
  const [newName, setNewName] = useState(
    getConversationDisplayName(conversation, currentUserId),
  );

  useEffect(() => {
    const resolvedName = getConversationDisplayName(conversation, currentUserId);
    setDisplayName(resolvedName);
    if (!showRenameModal) {
      setNewName(resolvedName);
    }
  }, [conversation, currentUserId, showRenameModal]);

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
        src={getConversationDisplayAvatar(conversation, currentUserId)}
        name={displayName}
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
            className="cursor-pointer p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
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
                <div className="relative h-28 w-28">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-amber-100">
                    <Avatar src={conversation.avatar} name={displayName} size={72} />
                  </div>
                  <div className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-amber-200 text-[16px] font-semibold text-amber-800">
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
                className="h-12 w-full rounded-md border border-primary-300 px-3 text-center text-[15px] text-gray-900 outline-none focus:border-primary-600"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setNewName(displayName || "");
                    setShowRenameModal(false);
                  }}
                  className="cursor-pointer rounded-md bg-gray-200 px-5 py-2 text-[16px] font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="cursor-pointer rounded-md bg-primary-700 px-5 py-2 text-[16px] font-semibold text-white hover:bg-primary-800"
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