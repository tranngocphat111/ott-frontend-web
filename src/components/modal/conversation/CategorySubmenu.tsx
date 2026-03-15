import React from "react";
import { motion } from "framer-motion";
import type { CategorySubmenuProps } from "../../../interfaces";
import { PiTagSimpleFill } from "react-icons/pi";

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
          onMouseDown={() => {
            onManageCategories();
            onClose();
          }}
          className="cursor-pointer w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Tạo phân loại mới
        </button>
      ) : (
        <>
          {/* Bỏ phân loại option - only show when category is selected */}
          {currentCategoryId && (
            <>
              <button
                onMouseDown={() => {
                  onSelectCategory(null);
                  onClose();
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">Bỏ phân loại</span>
              </button>
              <div className="border-t border-gray-200 my-1" />
            </>
          )}
          {categories.map((category) => (
            <button
              key={category._id}
              onMouseDown={() => {
                onSelectCategory(category._id);
                onClose();
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <PiTagSimpleFill color={category.color} />
              <span className="text-sm text-gray-700">{category.name}</span>
              {currentCategoryId === category._id && (
                <svg
                  className="w-4 h-4 ml-auto text-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
          <div className="border-t border-gray-200 my-1" />
          <button
            onMouseDown={() => {
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
