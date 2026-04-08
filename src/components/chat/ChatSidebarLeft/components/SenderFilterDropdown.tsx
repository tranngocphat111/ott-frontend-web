import React from "react";
import { ChevronDown, Search } from "lucide-react";
import type { SenderFilterDropdownProps } from "../../../../types";

const SenderFilterDropdown: React.FC<SenderFilterDropdownProps> = ({
  senderDropdownRef,
  isOpen,
  selectedSenderName,
  senderSearchText,
  filteredSenderOptions,
  onToggle,
  onSearchTextChange,
  onSelectAll,
  onSelectSender,
}) => {
  return (
    <div ref={senderDropdownRef} className="relative mt-2 pb-2">
      <button
        onClick={onToggle}
        className="flex h-9 w-full cursor-pointer items-center justify-between rounded-full bg-gray-100 px-4 text-[13px] text-gray-700"
      >
        <span className="truncate">{selectedSenderName}</span>
        <ChevronDown size={14} className="text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white p-2.5 shadow-xl">
          <div className="relative mb-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={senderSearchText}
              onChange={(e) => onSearchTextChange(e.target.value)}
              placeholder="Tìm kiếm"
              className="h-9 w-full rounded-full bg-gray-100 pl-9 pr-3 text-[13px] outline-none"
            />
          </div>

          <button
            onClick={onSelectAll}
            className="mb-1 w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-50"
          >
            Tất cả người gửi
          </button>

          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {filteredSenderOptions.map((sender) => (
              <button
                key={sender.id}
                onClick={() => onSelectSender(sender.id)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left hover:bg-gray-50"
              >
                <span className="truncate text-[14px] text-gray-800">
                  {sender.name}
                </span>
              </button>
            ))}

            {filteredSenderOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500">
                Không tìm thấy người gửi
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SenderFilterDropdown;
