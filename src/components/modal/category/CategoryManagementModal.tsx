import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryItem from './CategoryItem';
import AddCategoryForm from './AddCategoryForm';
import { CategoryService } from '../../../services';
import { useConversations } from '../../../contexts/ConversationsContext';
import type { Category } from '../../../types';
import type { CategoryManagementModalProps } from '../../../interfaces';

const defaultColors = [
  '#EF4444', '#F97316', '#EAB308', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#F43F5E', '#06B6D4', '#84CC16'
];

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const { categories, addCategory, updateCategory: updateCategoryContext, removeCategory } = useConversations();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(defaultColors[0]);


  const handleAdd = async () => {
    if (!newName.trim()) return;

    try {
      const newCategory = await CategoryService.createCategory({
        userId,
        name: newName,
        color: newColor,
        order: categories.length,
      });

      addCategory(newCategory); // Update context without reload
      setNewName('');
      setNewColor(defaultColors[0]);
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleUpdate = async (categoryId: string) => {
    if (!editName.trim()) return;

    try {
      await CategoryService.updateCategory(categoryId, {
        name: editName,
        color: editColor,
      });

      updateCategoryContext(categoryId, { name: editName, color: editColor }); // Update context
      setIsEditing(null);
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phân loại này?')) return;

    try {
      await CategoryService.deleteCategory(categoryId);
      removeCategory(categoryId); // Update context and remove from conversations
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const startEdit = (category: Category) => {
    setIsEditing(category._id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-100"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Quản lý thẻ phân loại</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Danh sách thẻ phân loại
              </h3>

              <div className="space-y-2">
                {categories.map((category) => (
                  <CategoryItem
                    key={category._id}
                    category={category}
                    isEditing={isEditing === category._id}
                    editName={editName}
                    editColor={editColor}
                    onEditStart={startEdit}
                    onEditNameChange={setEditName}
                    onEditColorChange={setEditColor}
                    onSaveEdit={() => handleUpdate(category._id)}
                    onCancelEdit={() => setIsEditing(null)}
                    onDelete={() => handleDelete(category._id)}
                  />
                ))}
              </div>

              {/* Add new category */}
              <div className="mt-4">
                <AddCategoryForm
                  isAdding={isAdding}
                  newName={newName}
                  newColor={newColor}
                  defaultColors={defaultColors}
                  onStartAdding={() => setIsAdding(true)}
                  onNameChange={setNewName}
                  onColorChange={setNewColor}
                  onSave={handleAdd}
                  onCancel={() => {
                    setIsAdding(false);
                    setNewName('');
                    setNewColor(defaultColors[0]);
                  }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CategoryManagementModal;
