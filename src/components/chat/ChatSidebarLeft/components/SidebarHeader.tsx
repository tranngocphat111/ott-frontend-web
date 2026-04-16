import React from "react";
import { MdOutlineGroupAdd, MdPersonAddAlt } from "react-icons/md";
import SearchBar from "../../../common/SearchBar";
import CategoryFilter from "../../../conversations/CategoryFilter";
import type { SidebarHeaderProps } from "../../../../types";

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  searchTerm,
  onSearchChange,
  onSearchFocus,
  isSearchPanelOpen,
  onCloseSearchPanel,
  onOpenCreateGroup,
  loading,
  error,
  filteredConversationCount,
  categories,
  selectedCategoryIds,
  onSelectCategories,
  filterMode,
  onFilterModeChange,
  onManageCategories,
}) => {
  return (
    <div className="p-4 border-b border-gray-100 pb-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Tìm kiếm..."
            onFocus={onSearchFocus}
          />
        </div>

        {isSearchPanelOpen && (
          <button
            onClick={onCloseSearchPanel}
            className="cursor-pointer px-1 text-[16px] font-semibold text-gray-700 hover:text-gray-900"
          >
            Đóng
          </button>
        )}

        {!isSearchPanelOpen && (
          <>
            <button
              className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Nhóm bạn mới"
            >
              <MdPersonAddAlt className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onOpenCreateGroup}
              className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Tạo nhóm mới"
            >
              <MdOutlineGroupAdd className="w-5 h-5 text-gray-600" />
            </button>
          </>
        )}
      </div>

      {!loading && !error && !isSearchPanelOpen && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {filteredConversationCount} cuộc hội thoại
          </span>
          <CategoryFilter
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            onSelectCategories={onSelectCategories}
            filterMode={filterMode}
            onFilterModeChange={onFilterModeChange}
            onManageCategories={onManageCategories}
          />
        </div>
      )}
    </div>
  );
};

export default SidebarHeader;
