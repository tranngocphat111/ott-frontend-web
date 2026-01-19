import React from 'react';
import { motion } from 'framer-motion';
import type { CategorySubmenuProps } from '../../../interfaces';

const CategorySubmenu: React.FC<CategorySubmenuProps> = ({
  isVisible,
  position,
  categories,
  currentCategoryId,
  onSelectCategory,
  onManageCategories,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-45 z-60"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {categories.length === 0 ? (
        <button
          onClick={() => {
            onManageCategories();
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Tạo phân loại mới
        </button>
      ) : (
        <>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => {
                onSelectCategory(category._id);
                onClose();
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
              <span className="text-sm text-gray-700">{category.name}</span>
              {currentCategoryId === category._id && (
                <svg className="w-4 h-4 ml-auto text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => {
              onManageCategories();
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Quản lý thẻ phân loại
          </button>
        </>
      )}
    </motion.div>
  );
};

export default CategorySubmenu;
