import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Category } from '../../types';

type FilterMode = 'all' | 'unread' | 'category';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryIds: string[];
  onSelectCategories: (categoryIds: string[]) => void;
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  onManageCategories?: () => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryIds,
  onSelectCategories,
  filterMode,
  onFilterModeChange,
  onManageCategories,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onSelectCategories(selectedCategoryIds.filter(id => id !== categoryId));
    } else {
      onSelectCategories([...selectedCategoryIds, categoryId]);
    }
  };

  const handleModeChange = (mode: FilterMode) => {
    onFilterModeChange(mode);
    if (mode === 'all' || mode === 'unread') {
      onSelectCategories([]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
        title="Phân loại"
      >
        <span className="text-md">Phân loại</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          >
            {/* Theo trạng thái */}
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-500 mb-2">Theo trạng thái</p>
              
              <label className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === 'all'}
                  onChange={() => handleModeChange('all')}
                  className="w-4 h-4 text-primary-500"
                />
                <span className="text-sm text-gray-700">Tất cả</span>
              </label>

              <label className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === 'unread'}
                  onChange={() => handleModeChange('unread')}
                  className="w-4 h-4 text-primary-500"
                />
                <span className="text-sm text-gray-700">Chưa đọc</span>
              </label>

              <label className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === 'category'}
                  onChange={() => handleModeChange('category')}
                  className="w-4 h-4 text-primary-500"
                />
                <span className="text-sm text-gray-700">Theo thẻ phân loại</span>
              </label>
            </div>

            {/* Categories - Only show when category mode is selected */}
            {filterMode === 'category' && categories.length > 0 && (
              <>
                <div className="border-t border-gray-200 my-2" />
                <div className="px-3 py-2 max-h-64 overflow-y-auto">
                  {categories.map((category) => (
                    <label
                      key={category._id}
                      className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(category._id)}
                        onChange={() => handleToggleCategory(category._id)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: category.color }}
                      />
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-700 flex-1">{category.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Manage Categories */}
            {onManageCategories && (
              <>
                <div className="border-t border-gray-200 my-2" />
                <button
                  onClick={() => {
                    onManageCategories();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Quản lý thẻ phân loại</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryFilter;
