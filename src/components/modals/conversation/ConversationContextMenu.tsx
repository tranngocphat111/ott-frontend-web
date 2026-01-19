import React, { useEffect, useRef, useState } from 'react';
import { Pin, Tag, BellOff, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MenuItem from './MenuItem';
import CategorySubmenu from './CategorySubmenu';
import MuteSubmenu from './MuteSubmenu';
import type { ConversationContextMenuProps } from '../../../interfaces';

const ConversationContextMenu: React.FC<ConversationContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onPin,
  onSelectCategory,
  onManageCategories,
  onMute,
  onDelete,
  isPinned = false,
  isMuted = false,
  categories,
  currentCategoryId,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      if (x + menuRect.width > viewportWidth) {
        x = viewportWidth - menuRect.width - 10;
      }

      if (y + menuRect.height > viewportHeight) {
        y = viewportHeight - menuRect.height - 10;
      }

      setAdjustedPosition({ x, y });
    }
  }, [isOpen, position]);

  const menuItems = [
    {
      id: 'pin',
      icon: Pin,
      label: isPinned ? 'Bỏ ghim hội thoại' : 'Ghim hội thoại',
      onClick: onPin,
      color: 'text-blue-600',
    },
    {
      id: 'category',
      icon: Tag,
      label: 'Phân loại',
      onClick: () => {},
      color: 'text-purple-600',
      hasSubmenu: true,
    },
    {
      id: 'mute',
      icon: BellOff,
      label: isMuted ? 'Bật thông báo' : 'Tắt thông báo',
      onClick: () => {},
      color: 'text-orange-600',
      hasSubmenu: true,
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Xóa hội thoại',
      onClick: onDelete,
      color: 'text-red-600',
      isDanger: true,
    },
  ];

  const handleMouseEnter = (itemId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    setHoveredItem(itemId);
    const rect = event.currentTarget.getBoundingClientRect();
    setSubmenuPosition({
      x: rect.right + 5,
      y: rect.top,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-50 z-50"
          style={{
            left: `${adjustedPosition.x}px`,
            top: `${adjustedPosition.y}px`,
          }}
        >
          {menuItems.map((item) => (
            <MenuItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => {
                if (!item.hasSubmenu) {
                  item.onClick();
                  onClose();
                }
              }}
              onMouseEnter={(e) => item.hasSubmenu && handleMouseEnter(item.id, e)}
              onMouseLeave={() => !item.hasSubmenu && setHoveredItem(null)}
              color={item.color}
              isDanger={item.isDanger}
              hasSubmenu={item.hasSubmenu}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <CategorySubmenu
        isVisible={hoveredItem === 'category'}
        position={submenuPosition}
        categories={categories}
        currentCategoryId={currentCategoryId}
        onSelectCategory={onSelectCategory}
        onManageCategories={onManageCategories}
        onClose={onClose}
        onMouseEnter={() => setHoveredItem('category')}
        onMouseLeave={() => setHoveredItem(null)}
      />

      <MuteSubmenu
        isVisible={hoveredItem === 'mute'}
        position={submenuPosition}
        isMuted={isMuted}
        onMute={onMute}
        onClose={onClose}
        onMouseEnter={() => setHoveredItem('mute')}
        onMouseLeave={() => setHoveredItem(null)}
      />
    </>
  );
};

export default ConversationContextMenu;
