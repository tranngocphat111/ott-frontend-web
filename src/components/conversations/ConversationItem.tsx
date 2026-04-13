import React, { useState, useEffect } from "react";
import { MessageCircle, Users, Pin } from "lucide-react";
import Avatar from "../common/Avatar";
import { formatTimeAgo } from "../../utils/timeUtils";
import ConversationContextMenu from "../modal/conversation/ConversationContextMenu";
import CategoryManagementModal from "../modal/category/CategoryManagementModal";
import { ConfirmModal } from "../modal/ConfirmModal";
import type { ConversationItemProps } from "../../interfaces";
import { ParticipantService } from "../../services";
import type { Category } from "../../types";
import { useConversations } from "../../contexts/ConversationsContext";
import { PiTagSimpleFill } from "react-icons/pi";
import { FaBellSlash } from "react-icons/fa6";
import {
  getConversationDisplayAvatar,
  getConversationDisplayName,
} from "../../utils";
import { EmojiText } from "../chat/EmojiText";

const ConversationItem: React.FC<ConversationItemProps> = ({
  item,
  isSelected = false,
  onClick,
  currentUserId,
}) => {
  const { conversation, participant } = item;
  const { categories, refreshConversations, updateParticipant } =
    useConversations();
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);

  useEffect(() => {
    // Find and set current category from participant settings
    if (participant.settings.category_id && categories.length > 0) {
      const category = categories.find(
        (cat) => cat._id === participant.settings.category_id,
      );
      setCurrentCategory(category || null);
    } else {
      setCurrentCategory(null);
    }
  }, [participant.settings.category_id, categories]);

  // Check if conversation is muted
  const isMuted = !!(
    participant.settings.notification_status === "mute" &&
    participant.settings.mute_until &&
    new Date(participant.settings.mute_until) > new Date()
  );

  const getConversationName = (): string => {
    return (
      getConversationDisplayName(conversation, currentUserId) || "Conversation"
    );
  };

  const getConversationAvatar = (): string | undefined => {
    return getConversationDisplayAvatar(conversation, currentUserId);
  };

  const getLatestMessagePreview = (): string => {
    const lastMsg = conversation.last_message;
    if (!lastMsg?.content) return "Chưa có tin nhắn";

    // System messages (thêm vào nhóm, v.v.) hiển thị thẳng, không cần tiền tố tên
    if ((lastMsg.type as string)?.startsWith("system")) return lastMsg.content;

    const senderParticipant = (conversation.participants || []).find(
      (participant) => {
        const participantId = String(
          participant.user_id || participant._id || "",
        );
        return participantId === String(lastMsg.sender_id || "");
      },
    );

    const preferredSenderName =
      (senderParticipant?.nickname || "").trim() ||
      (senderParticipant?.display_name || "").trim() ||
      (senderParticipant?.name || "").trim() ||
      (lastMsg.sender_name || "").trim();

    const prefix =
      lastMsg.sender_id === currentUserId ? "Bạn" : preferredSenderName;

    return prefix ? `${prefix}: ${lastMsg.content}` : lastMsg.content;
  };

  const getTimeDisplay = (): string => {
    // Ưu tiên thời gian từ last_message
    const time = conversation.last_message?.createdAt || conversation.createdAt;
    return formatTimeAgo(time);
  };

  const unreadCount = Number(participant.unread_count || 0);
  const hasUnreadMessage = !isSelected && unreadCount > 0;
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handlePin = async () => {
    if (!currentUserId) return;

    try {
      await ParticipantService.updatePinStatus(
        conversation._id,
        currentUserId,
        !participant.settings.is_pinned,
      );

      // Refresh from API to get updated data from database
      await refreshConversations(currentUserId);
    } catch (error) {
      console.error("Error updating pin status:", error);
    }
  };

  const handleSelectCategory = async (categoryId: string | null) => {
    if (!currentUserId) return;

    try {
      await ParticipantService.updateConversationCategory(
        conversation._id,
        currentUserId,
        categoryId,
      );

      // Refresh from API to get updated data from database
      await refreshConversations(currentUserId);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleManageCategories = () => {
    setIsCategoryModalOpen(true);
  };

  const handleMute = async (duration: string) => {
    if (!currentUserId) return;

    let muteUntil: Date | null = null;
    let status: "on" | "mute" = "mute";

    // Handle unmute
    if (duration === "unmute") {
      status = "on";
      muteUntil = null;
    } else if (duration === "1h") {
      muteUntil = new Date(Date.now() + 60 * 60 * 1000);
    } else if (duration === "4h") {
      muteUntil = new Date(Date.now() + 4 * 60 * 60 * 1000);
    } else if (duration === "8h") {
      muteUntil = new Date(Date.now() + 8 * 60 * 60 * 1000);
    } else if (duration === "forever") {
      // Set a far future date for "forever"
      muteUntil = new Date("2099-12-31");
    }

    try {
      await ParticipantService.updateNotificationSettings(
        conversation._id,
        currentUserId,
        status,
        muteUntil,
      );

      // Refresh from API to get updated data from database
      await refreshConversations(currentUserId);
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteConversation = async () => {
    if (!currentUserId || isDeletingConversation) return;

    setIsDeletingConversation(true);
    try {
      const updatedParticipant = await ParticipantService.deleteConversation(
        conversation._id,
        currentUserId,
      );
      // Cập nhật deleted_msg_id trong state — Sidebar filter sẽ tự động ẩn conversation
      updateParticipant(conversation._id, {
        deleted_msg_id: updatedParticipant.deleted_msg_id,
      });
      setIsDeleteModalOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa cuộc hội thoại";
      window.alert(message);
      console.error("Error deleting conversation:", error);
    } finally {
      setIsDeletingConversation(false);
    }
  };

  return (
    <>
      <div
        className={`
          relative p-3 rounded-xl cursor-pointer transition-all duration-300
          mx-2 
          ${
            isSelected
              ? "bg-primary-500/10 shadow-md "
              : "hover:bg-gray-50 hover:shadow-sm"
          }
          ${isHovered ? "shadow-lg" : ""}
        `}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
        )}

        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            <Avatar
              src={getConversationAvatar()}
              name={getConversationName()}
              size={48}
              className="ring-1 ring-gray-200"
            />

            {/* Conversation type indicator */}
            <div
              className={`
            absolute -bottom-1 -right-1 w-5 h-5 rounded-full 
            flex items-center justify-center bg-white
            ring-2 ring-gray-100 shadow-sm
          `}
            >
              {conversation.type === "group" ? (
                <Users className="w-3 h-3 text-primary-500" />
              ) : (
                <MessageCircle className="w-3 h-3 text-primary-500" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <h3
                  className={`
                font-semibold truncate transition-colors duration-200 select-none
                ${isSelected ? "text-primary-500" : "text-gray-900"}
                ${isHovered ? "text-primary-500" : ""}
              `}
                >
                  {getConversationName()}
                </h3>
                {participant.settings.is_pinned && (
                  <Pin className="w-3 h-3 text-gray-400 shrink-0" />
                )}
              </div>

              <div className="flex items-center space-x-1 ml-2 ">
                {isMuted && <FaBellSlash className="w-4 h-4 text-gray-400" />}
                <span
                  className={`text-xs  whitespace-nowrap select-none max-w-18 ${hasUnreadMessage ? "text-primary-500 font-medium" : "text-gray-400"}`}
                >
                  {getTimeDisplay()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Category tag - before message */}
              {currentCategory && (
                <PiTagSimpleFill
                  className="shrink-0"
                  color={currentCategory.color}
                />
              )}

              <p
                className={`text-sm truncate flex-1 select-none ${hasUnreadMessage ? "text-gray-900 font-semibold" : "text-gray-600"}`}
              >
                <EmojiText
                  text={getLatestMessagePreview()}
                  emojiSize={15}
                  emojiClassName="inline-block align-[-0.2em] me-1"
                />
              </p>

              {/* Unread badge */}
              {hasUnreadMessage && (
                <div className="min-w-5 h-5 px-1 rounded-full bg-primary-500 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                  {unreadLabel}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <ConversationContextMenu
        isOpen={contextMenu !== null}
        position={contextMenu || { x: 0, y: 0 }}
        onClose={() => setContextMenu(null)}
        onPin={handlePin}
        onSelectCategory={handleSelectCategory}
        onManageCategories={handleManageCategories}
        onMute={handleMute}
        onDelete={handleDelete}
        isPinned={participant.settings.is_pinned}
        isMuted={isMuted}
        categories={categories}
        currentCategoryId={participant.settings.category_id || undefined}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
        }}
        userId={currentUserId || ""}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Xóa hội thoại"
        message="Bạn có chắc chắn muốn xóa lịch sử hội thoại này không? Bạn vẫn có thể nhận lại tin nhắn mới từ cuộc trò chuyện này sau đó."
        confirmText={isDeletingConversation ? "Đang xóa..." : "Xóa hội thoại"}
        cancelText="Hủy"
        isDangerous={true}
        onConfirm={handleConfirmDeleteConversation}
        onCancel={() => {
          if (!isDeletingConversation) {
            setIsDeleteModalOpen(false);
          }
        }}
      />
    </>
  );
};

export default ConversationItem;
