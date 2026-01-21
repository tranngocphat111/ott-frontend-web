import React from 'react';
import { Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Category } from '../../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Lọc theo phân loại</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* All categories button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectCategory(null)}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium transition-all
            flex items-center gap-1.5
            ${!selectedCategoryId
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }
          `}
        >
          Tất cả
          {!selectedCategoryId && categories.length > 0 && (
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
              {categories.length}
            </span>
          )}
        </motion.button>

        {/* Category buttons */}
        {categories.map((category) => (
          <motion.button
            key={category._id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectCategory(category._id)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all
              flex items-center gap-1.5
              ${selectedCategoryId === category._id
                ? 'text-white shadow-md'
                : 'bg-white hover:bg-opacity-80 border border-gray-200'
              }
            `}
            style={{
              backgroundColor: selectedCategoryId === category._id ? category.color : undefined,
              color: selectedCategoryId === category._id ? 'white' : category.color,
            }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
            {selectedCategoryId === category._id && (
              <X className="w-3 h-3" />
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedCategoryId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-xs text-gray-500"
          >
            Đang lọc theo: <span className="font-medium">
              {categories.find(c => c._id === selectedCategoryId)?.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryFilter;
