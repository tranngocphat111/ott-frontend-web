import React from 'react';
import { Plus, Check, X } from 'lucide-react';
import type { AddCategoryFormProps } from '../../../interfaces';

const AddCategoryForm: React.FC<AddCategoryFormProps> = ({
  isAdding,
  newName,
  newColor,
  defaultColors,
  onStartAdding,
  onNameChange,
  onColorChange,
  onSave,
  onCancel,
}) => {
  if (!isAdding) {
    return (
      <button
        onClick={onStartAdding}
        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>Thêm phân loại mới</span>
      </button>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
      <input
        type="text"
        value={newName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Tên phân loại..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        autoFocus
      />

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Chọn màu:</p>
        <div className="flex flex-wrap gap-2">
          {defaultColors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-8 h-8 rounded-full transition-transform ${
                newColor === color ? 'ring-2 ring-primary-500 ring-offset-2 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Lưu
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AddCategoryForm;
