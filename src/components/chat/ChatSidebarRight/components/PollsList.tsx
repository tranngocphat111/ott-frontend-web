import React from "react";
import { ListChecks, MessageSquare, ArrowRight } from "lucide-react";
import type { Message } from "../../../../types";
import { formatChatTimestamp } from "../../../../utils";

interface PollsListProps {
  messages: Message[];
  conversationId: string;
  onJump: (message: Message) => void;
}

const PollsList: React.FC<PollsListProps> = ({ messages, conversationId, onJump }) => {
  const validMessages = (messages || []).filter(
    (msg) => msg && msg._id && msg.type === "poll"
  );

  if (validMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <ListChecks size={32} className="text-gray-300" />
        </div>
        <p className="text-sm text-gray-500 font-medium">Chưa có bình chọn nào</p>
        <p className="text-xs text-gray-400 mt-1">Tạo bình chọn để giúp nhóm quyết định nhanh hơn</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {validMessages.map((msg) => {
        const totalVotes = (msg.poll_options || []).reduce(
          (sum, opt) => sum + (opt.voters?.length || 0),
          0
        );

        return (
          <div
            key={msg._id}
            className="group bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer"
            onClick={() => onJump(msg)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                <ListChecks size={20} className="text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[15px] font-bold text-slate-800 leading-tight line-clamp-2">
                  {msg.poll_question || "Khảo sát"}
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[12px] text-slate-500 font-medium">
                    {msg.sender_name || "Thành viên"}
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="text-[12px] text-slate-400">
                    {formatChatTimestamp(msg.createdAt || msg.created_at || "")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary-600 font-semibold text-[13px]">
                <MessageSquare size={14} />
                <span>{totalVotes} lượt bình chọn</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-[12px] group-hover:text-primary-600 transition-colors">
                <span>Xem chi tiết</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PollsList;
