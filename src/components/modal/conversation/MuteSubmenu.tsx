import React from 'react';
import { motion } from 'framer-motion';
import type { MuteSubmenuProps, MuteOption } from '../../../interfaces';

const muteOptions: MuteOption[] = [
  { id: '1h', label: 'Trong 1 giờ' },
  { id: '4h', label: 'Trong 4 giờ' },
  { id: '8h', label: 'Trong 8 giờ' },
  { id: 'forever', label: 'Cho đến khi được mở lại' },
];

const MuteSubmenu: React.FC<MuteSubmenuProps> = ({
  isVisible,
  position,
  isMuted,
  onMute,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!isVisible) return null;

  // If already muted, show unmute option
  if (isMuted) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.15 }}
        className="fixed flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-45 z-60"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <button
          onMouseDown={() => {
            onMute('unmute');
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Bật thông báo
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
      className="fixed flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-45 z-60"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {muteOptions.map((option) => (
        <button
          key={option.id}
          onMouseDown={() => {
            onMute(option.id);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {option.label}
        </button>
      ))}
    </motion.div>
  );
};

export default MuteSubmenu;
