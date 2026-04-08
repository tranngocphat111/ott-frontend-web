import React from "react";
import SenderFilterDropdown from "./SenderFilterDropdown";
import RecentSearchList from "./RecentSearchList";
import SearchContactsSection from "./SearchContactsSection";
import SearchConversationsSection from "./SearchConversationsSection";
import SearchMessagesSection from "./SearchMessagesSection";
import SearchFilesSection from "./SearchFilesSection";
import type { SearchResultsPanelProps, SearchTab } from "../../../../types";

const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({
  isSearchPanelOpen,
  keyword,
  isSearching,
  searchResults,
  searchTab,
  setSearchTab,
  senderOptions,
  isSenderDropdownOpen,
  senderDropdownRef,
  selectedSenderName,
  senderSearchText,
  filteredSenderOptions,
  onToggleSenderDropdown,
  onSenderSearchTextChange,
  onSelectAllSender,
  onSelectSender,
  filteredSearchMessages,
  conversationResultsByName,
  conversationMetaMap,
  highlightKeyword,
  onOpenConversation,
  historyConversations,
  normalizedUserId,
  onRemoveHistoryItem,
  onClearAllHistory,
}) => {
  if (!isSearchPanelOpen) return null;

  if (!keyword) {
    return (
      <RecentSearchList
        historyConversations={historyConversations}
        normalizedUserId={normalizedUserId}
        onOpenConversation={onOpenConversation}
        onRemoveHistoryItem={onRemoveHistoryItem}
        onClearAllHistory={onClearAllHistory}
      />
    );
  }

  if (isSearching) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Đang tìm kiếm...
      </div>
    );
  }

  if (!searchResults || searchResults.total === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Không tìm thấy kết quả phù hợp
      </div>
    );
  }

  const tabButtons: Array<{ id: SearchTab; label: string }> = [
    { id: "all", label: "Tất cả" },
    { id: "contacts", label: "Liên hệ" },
    { id: "messages", label: "Tin nhắn" },
    { id: "files", label: "File" },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar border-t border-gray-100 pb-4">
      <div className="sticky top-0 z-10 bg-white px-4 pt-2">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-2 text-sm font-semibold text-gray-700">
          {tabButtons.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchTab(tab.id)}
              className={`cursor-pointer border-b-2 pb-1 transition-colors ${
                searchTab === tab.id
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {searchTab === "messages" && senderOptions.length > 0 && (
          <SenderFilterDropdown
            senderDropdownRef={senderDropdownRef}
            isOpen={isSenderDropdownOpen}
            selectedSenderName={selectedSenderName}
            senderSearchText={senderSearchText}
            filteredSenderOptions={filteredSenderOptions}
            onToggle={onToggleSenderDropdown}
            onSearchTextChange={onSenderSearchTextChange}
            onSelectAll={onSelectAllSender}
            onSelectSender={onSelectSender}
          />
        )}
      </div>

      <div className="space-y-4 px-2 pt-3">
        {(searchTab === "all" || searchTab === "contacts") && (
          <SearchContactsSection
            contacts={searchResults.contacts}
            searchTab={searchTab}
            onOpenConversation={(conversationId) => onOpenConversation(conversationId)}
          />
        )}

        {(searchTab === "all" || searchTab === "contacts") && (
          <SearchConversationsSection
            conversations={conversationResultsByName}
            searchTab={searchTab}
            onOpenConversation={(conversationId) => onOpenConversation(conversationId)}
            highlightKeyword={highlightKeyword}
          />
        )}

        {(searchTab === "all" || searchTab === "messages") && (
          <SearchMessagesSection
            messages={filteredSearchMessages}
            searchTab={searchTab}
            conversationMetaMap={conversationMetaMap}
            onOpenConversation={onOpenConversation}
            highlightKeyword={highlightKeyword}
          />
        )}

        {(searchTab === "all" || searchTab === "files") && (
          <SearchFilesSection
            files={searchResults.files}
            searchTab={searchTab}
            conversationMetaMap={conversationMetaMap}
            onOpenConversation={onOpenConversation}
            highlightKeyword={highlightKeyword}
          />
        )}
      </div>
    </div>
  );
};

export default SearchResultsPanel;
