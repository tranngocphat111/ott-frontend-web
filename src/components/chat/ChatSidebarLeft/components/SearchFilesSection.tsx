import React from "react";
import { FileText } from "lucide-react";
import type { SearchFilesSectionProps } from "../../../../types";

const SearchFilesSection: React.FC<SearchFilesSectionProps> = ({
  files,
  searchTab,
  conversationMetaMap,
  onOpenConversation,
  highlightKeyword,
}) => {
  if (files.length === 0) return null;

  return (
    <section className="px-2">
      <h4 className="mb-2 text-sm font-semibold text-gray-800">
        <FileText className="mr-1 inline h-4 w-4" /> File ({files.length})
      </h4>
      <div className="space-y-1">
        {files
          .slice(0, searchTab === "all" ? 3 : 24)
          .map((file) => {
            const senderDisplayName =
              conversationMetaMap
                .get(file.conversation_id)
                ?.senderNameById?.[file.sender_id] ||
              file.sender_name ||
              file.sender_id;

            return (
              <button
                key={file._id}
                onClick={() =>
                  onOpenConversation(
                    file.conversation_id,
                    file.msg_id || file.message_id,
                  )
                }
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-gray-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100">
                  <FileText size={16} className="text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {highlightKeyword(file.file_name)}
                  </p>
                  <p className="text-xs text-gray-500">{senderDisplayName}</p>
                </div>
              </button>
            );
          })}
      </div>
    </section>
  );
};

export default SearchFilesSection;
