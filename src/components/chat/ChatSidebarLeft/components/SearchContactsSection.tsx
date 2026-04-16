import React from "react";
import { Users } from "lucide-react";
import Avatar from "../../../common/Avatar";
import type { SearchContactsSectionProps } from "../../../../types";

const SearchContactsSection: React.FC<SearchContactsSectionProps> = ({
  contacts,
  searchTab,
  onOpenConversation,
}) => {
  if (contacts.length === 0) return null;

  return (
    <section className="px-2">
      <h4 className="mb-2 text-sm font-semibold text-gray-800">
        <Users className="mr-1 inline h-4 w-4" /> Liên hệ ({contacts.length})
      </h4>
      <div className="space-y-1">
        {contacts
          .slice(0, searchTab === "all" ? 3 : 24)
          .map((item) => {
            const targetConversationId = item.conversation_ids?.[0];
            return (
              <button
                key={item.user_id}
                onClick={() => targetConversationId && onOpenConversation(targetConversationId)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-gray-50"
              >
                <Avatar src={item.avatar || ""} name={item.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.phone || item.user_id}</p>
                </div>
              </button>
            );
          })}
      </div>
    </section>
  );
};

export default SearchContactsSection;
