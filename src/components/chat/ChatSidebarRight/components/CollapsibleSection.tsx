import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { CollapsibleSectionProps } from "../../../../interfaces";

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = true,
  children,
  badge,
  onClick,
  showIndicator = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleClick = () => {
    // Nếu có onClick, chỉ gọi onClick (không toggle)
    // Nếu không có onClick, chỉ toggle mở/đóng
    if (onClick) {
      onClick();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="border-t border-gray-100">
      <button
        onClick={handleClick}
        className="w-full cursor-pointer grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-2 px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className="flex h-6 w-6 items-center justify-center text-gray-500">
          {icon}
        </span>
        <div className="min-w-0 flex items-center gap-2 text-left">
          <span className="block min-w-0 truncate text-[15px] font-medium leading-6 text-gray-700">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="shrink-0 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>

        {/* Show arrow only if no onClick (collapsible mode) */}
        {!onClick && showIndicator && (
          <>
            {isOpen ? (
              <ChevronUp size={16} className="text-gray-400 justify-self-end" />
            ) : (
              <ChevronDown size={16} className="text-gray-400 justify-self-end" />
            )}
          </>
        )}


      </button>

      {/* Only show content for collapsible sections (no onClick) */}
      {!onClick && isOpen && children && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
