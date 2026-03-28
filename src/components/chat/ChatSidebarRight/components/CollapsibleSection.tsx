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
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-500">{icon}</span>
          <span className="text-[15px] font-medium text-gray-700">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        
        {/* Show arrow only if no onClick (collapsible mode) */}
        {!onClick && showIndicator && (
          <>
            {isOpen ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </>
        )}
        
        {/* Show navigation arrow for onClick sections */}
        {onClick && showIndicator && (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>
      
      {/* Only show content for collapsible sections (no onClick) */}
      {!onClick && isOpen && children && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;