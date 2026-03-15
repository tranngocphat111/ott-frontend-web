import React from 'react';
import { Edit2, Trash2, GripVertical, Check, X } from 'lucide-react';
import type { CategoryItemProps } from '../../../interfaces';

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isEditing,
  editName,
  editColor,
  onEditStart,
  onEditNameChange,
  onEditColorChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />

      {isEditing ? (
        <>
          <input
            type="color"
            value={editColor}
            onChange={(e) => onEditColorChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <button
            onClick={onSaveEdit}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            onClick={onCancelEdit}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </>
      ) : (
        <>
          <div
            className="w-6 h-6 rounded"
            style={{ backgroundColor: category.color }}
          />
          <span className="flex-1 font-medium text-gray-900">{category.name}</span>
          <button
            onClick={() => onEditStart(category)}
            className="p-1.5 text-gray-600 hover:text-primary-500 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

export default CategoryItem;
