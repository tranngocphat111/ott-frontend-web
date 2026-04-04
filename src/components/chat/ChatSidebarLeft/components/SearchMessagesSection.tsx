import React from "react";
import { MessageSquare } from "lucide-react";
import SearchMessageRow from "./SearchMessageRow";
import type { SearchMessagesSectionProps } from "../../../../types";

const SearchMessagesSection: React.FC<SearchMessagesSectionProps> = ({
  messages,
  searchTab,
  conversationMetaMap,
  onOpenConversation,
  highlightKeyword,
}) => {
  if (messages.length === 0) return null;

  return (
    <section className="px-2">
      <h4 className="mb-2 text-sm font-semibold text-gray-800">
        <MessageSquare className="mr-1 inline h-4 w-4" /> Tin nhắn ({messages.length})
      </h4>
      <div className="space-y-1">
        {messages
          .slice(0, searchTab === "all" ? 4 : 30)
          .map((msg) => (
            <SearchMessageRow
              key={msg._id}
              msg={msg}
              conversationMetaMap={conversationMetaMap}
              onOpenConversation={onOpenConversation}
              highlightKeyword={highlightKeyword}
            />
          ))}
      </div>
    </section>
  );
};

export default SearchMessagesSection;
