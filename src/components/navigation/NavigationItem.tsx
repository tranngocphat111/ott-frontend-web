import React from 'react';
import type { NavigationItemProps } from '../../interfaces';

const NavigationItem: React.FC<NavigationItemProps> = ({ item, onItemClick }) => {
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
    </button>
  );
};

export default NavigationItem;
