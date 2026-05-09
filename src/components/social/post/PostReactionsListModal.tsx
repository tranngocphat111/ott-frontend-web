import React, { useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { fetchPostReactionDetails, type ApiReaction } from "../../../services/post.service";
import { REACTIONS, getReactionByKey } from "./reactions";
import { useNavigate } from "react-router-dom";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

const PostReactionsListModal: React.FC<Props> = ({ isOpen, onClose, postId }) => {
  const [reactions, setReactions] = useState<ApiReaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ALL"); // "ALL" hoặc reaction key
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setActiveTab("ALL");
      setIsLoading(true);
      fetchPostReactionDetails(postId)
        .then((data) => setReactions(data))
        .finally(() => setIsLoading(false));
    } else {
      setReactions([]);
    }
  }, [isOpen, postId]);

  // Đếm số lượng từng loại reaction để hiển thị lên tabs
  const reactionCounts: Record<string, number> = {};
  reactions.forEach((r) => {
    const key = r.reactionType.toLowerCase();
    reactionCounts[key] = (reactionCounts[key] || 0) + 1;
  });

  // Chỉ lấy những loại có số lượng > 0
  const availableTabs = REACTIONS.filter((r) => reactionCounts[r.key] > 0);

  // Lọc danh sách theo tab hiện tại
  const filteredReactions = activeTab === "ALL"
    ? reactions
    : reactions.filter((r) => r.reactionType.toLowerCase() === activeTab);

  const handleUserClick = (accountId: string) => {
    onClose();
    navigate(`/social/profile/${accountId}`);
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-gray-900">
                    Cảm xúc
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="px-2 pt-2 border-b border-gray-100 flex gap-1 overflow-x-auto sticky top-[53px] bg-white z-10">
                  <button
                    onClick={() => setActiveTab("ALL")}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${activeTab === "ALL"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:bg-gray-50 rounded-t-lg"
                      }`}>
                    Tất cả {reactions.length}
                  </button>
                  {availableTabs.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setActiveTab(r.key)}
                      className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === r.key
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:bg-gray-50 rounded-t-lg"
                        }`}>
                      <span>{r.emoji}</span>
                      <span>{reactionCounts[r.key]}</span>
                    </button>
                  ))}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  ) : filteredReactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Chưa có cảm xúc nào
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {filteredReactions.map((r) => {
                        const reactDef = getReactionByKey(r.reactionType.toLowerCase() as any);
                        return (
                          <div
                            key={r.id}
                            onClick={() => handleUserClick(r.accountId)}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                {r.accountAvatarUrl ? (
                                  <img
                                    src={r.accountAvatarUrl}
                                    alt={r.accountDisplayName || r.accountUsername}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-lg">
                                    {(r.accountDisplayName || r.accountUsername || "?")[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {r.accountDisplayName || "Người dùng"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PostReactionsListModal;
