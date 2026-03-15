import React from 'react';
import type { MenuItemProps } from '../../../interfaces';

const MenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  label,
  onClick,
  color,
  isDanger = false,
  hasSubmenu = false,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        w-full px-4 py-2.5 text-left flex cursor-pointer items-center gap-3
        hover:bg-gray-50 transition-colors duration-150
        ${isDanger ? 'hover:bg-red-50' : ''}
      `}
    >
      <Icon className={`w-4 h-4 ${color}`} />
      <span className={`text-sm ${isDanger ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
        {label}
      </span>
      {hasSubmenu && (
        <svg
          className="w-4 h-4 ml-auto text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
};

export default MenuItem;
