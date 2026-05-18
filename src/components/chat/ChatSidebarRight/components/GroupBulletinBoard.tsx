import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { GroupBulletinBoardProps, BulletinTab } from "../../../../interfaces";
import PinnedMessages from "./PinnedMessages";
import PollsList from "./PollsList";
import type { Message } from "../../../../types";

const GroupBulletinBoard: React.FC<GroupBulletinBoardProps> = ({
    conversationId,
    currentUserId,
    pinnedMessages,
    pollMessages,
    activeTab: initialTab = "pinned",
    onUnpin,
    onBack,
    conversationType,
}) => {
    const isGroup = conversationType === "group";
    const [activeTab, setActiveTab] = useState<BulletinTab>(initialTab);

    const handleJumpToMessage = (message: Message) => {
        const msgId = String(message?.msg_id || message?._id || "");
        if (!msgId || !conversationId) return;

        const messageType = String(message?.type || "").toLowerCase();
        const canOpenMediaViewer = ["image", "video"].includes(messageType);
        const mediaMessageId = String(message?._id || "");

        window.dispatchEvent(
            new CustomEvent("chat:jump", {
                detail: {
                    conversationId,
                    messageId: msgId,
                    highlight: true,
                    openMedia: canOpenMediaViewer,
                    mediaMessageId: canOpenMediaViewer && mediaMessageId ? mediaMessageId : undefined,
                    imageIndex: 0,
                    fromBulletin: true,
                },
            }),
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
                <button
                    onClick={onBack}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                    <ChevronLeft size={20} className="text-gray-600" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900">
                    {isGroup ? "Bảng tin nhóm" : "Tin nhắn đã ghim"}
                </h2>
            </div>

            {/* Tabs - Only show for groups */}
            {isGroup && (
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab("pinned")}
                        className={`flex-1 py-3 text-[14px] font-semibold text-center transition-all relative ${activeTab === "pinned" ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        Tin nhắn đã ghim
                        {activeTab === "pinned" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 mx-4" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("polls")}
                        className={`flex-1 py-3 text-[14px] font-semibold text-center transition-all relative ${activeTab === "polls" ? "text-primary-600" : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        Bình chọn
                        {activeTab === "polls" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 mx-4" />
                        )}
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                {(!isGroup || activeTab === "pinned") ? (
                    <div className="p-4">
                        <PinnedMessages
                            messages={pinnedMessages}
                            conversationId={conversationId}
                            currentUserId={currentUserId}
                            onUnpin={onUnpin}
                        />
                    </div>
                ) : (
                    <PollsList
                        messages={pollMessages}
                        conversationId={conversationId}
                        onJump={handleJumpToMessage}
                    />
                )}
            </div>
        </div>
    );
};

export default GroupBulletinBoard;
