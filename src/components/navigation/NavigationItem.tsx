import React from 'react';
import type { NavigationItemProps } from '../../interfaces';

const NavigationItem: React.FC<NavigationItemProps> = ({ item, onItemClick }) => {
  const badgeCount = Math.max(0, Number(item.badge || 0));
  const hasBadge = badgeCount > 0;
  const badgeLabel = badgeCount > 99 ? "99+" : String(badgeCount);

  return (
    <button
      onClick={() => onItemClick?.(item.id)}
      className={`
        cursor-pointer 
        relative p-3 rounded-xl transition-all duration-200 group
        ${item.isActive 
          ? 'bg-primary-500 text-white shadow-md' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-primary-500'
        }
      `}
      title={item.label}
    >
      {item.icon}
      {hasBadge && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm"
          aria-label={`${badgeLabel} tin nhắn chưa đọc`}
        >
          {badgeLabel}
        </span>
      )}
    </button>
  );
};

export default NavigationItem;
