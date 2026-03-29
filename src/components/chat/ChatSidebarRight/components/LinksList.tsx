import React from "react";
import { Link as LinkIcon } from "lucide-react";
import type { LinkData } from "../../../../interfaces";

interface LinksListProps {
  messages: LinkData[];
  onViewAll: () => void;
}

const LinksList: React.FC<LinksListProps> = ({ messages, onViewAll }) => {
  const validMessages = (messages || []).filter(
    (msg) => msg && msg._id && Array.isArray(msg.links),
  );

  const allLinks: Array<{ message: LinkData; link: string }> = [];

  validMessages.forEach((message) => {
    message.links.forEach((link) => {
      allLinks.push({ message, link });
    });
  });

  if (allLinks.length === 0) {
    return (
      <div className="text-center py-12">
        <LinkIcon size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Chưa có link nào</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 mb-3">
        {allLinks.slice(0, 3).map(({ message, link }, index) => {
          try {
            const urlObj = new URL(link);

            // Extract title from link (simplified)
            let title = link;
            if (link.includes('discord.gg')) {
              title = 'Tham gia Máy Chủ Discord Nhóm Côn...';
            } else if (link.includes('g.co/gemini')) {
              title = 'https://g.co/gemini/share/d34d1c0a4...';
            } else if (link.includes('bytes.usc.edu')) {
              title = 'https://bytes.usc.edu/~saty/courses/...';
            } else {
              title = link.length > 40 ? `${link.substring(0, 40)}...` : link;
            }

            return (
              <div
                key={`${message._id}-${index}`}
                className="flex items-center gap-3 p-2 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
              >
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center shrink-0">
                  <LinkIcon size={14} className="text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {title}
                  </p>
                  <p className="text-xs text-amber-700 truncate">{urlObj.hostname}</p>
                </div>
                <div className="text-xs text-gray-400 shrink-0">
                  {message.createdAt
                    ? new Date(message.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })
                    : "11/01"
                  }
                </div>
              </div>
            );
          } catch (error) {
            console.warn("Invalid URL:", link);
            return null;
          }
        }).filter(Boolean)}
      </div>
      <button
        onClick={() => {
          onViewAll();
        }}
        className="w-full cursor-pointer py-2.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
      >
        Xem tất cả
      </button>
    </div>
  );
};

export default LinksList;
