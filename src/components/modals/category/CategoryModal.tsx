import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Category } from '../../../types';
import type { CategoryModalProps } from '../../../interfaces';

const defaultColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
];

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(defaultColors[0]);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');

  useEffect(() => {
    if (isOpen && currentUserId) {
      loadCategories();
    }
  }, [isOpen, currentUserId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/categories/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to load categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Vui lòng nhập tên phân loại');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          name: newCategoryName,
          color: newCategoryColor,
          order: categories.length + 1,
        }),
      });

      if (!response.ok) throw new Error('Failed to create category');
      
      await loadCategories();
      setIsAdding(false);
      setNewCategoryName('');
      setNewCategoryColor(defaultColors[0]);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Không thể tạo phân loại');
    }
  };

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editingName.trim()) {
      alert('Vui lòng nhập tên phân loại');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          name: editingName,
          color: editingColor,
        }),
      });

      if (!response.ok) throw new Error('Failed to update category');
      
      await loadCategories();
      setEditingId(null);
      setEditingName('');
      setEditingColor('');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Không thể cập nhật phân loại');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phân loại này?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!response.ok) throw new Error('Failed to delete category');
      
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Không thể xóa phân loại');
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category._id);
    setEditingName(category.name);
    setEditingColor(category.color);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingColor('');
  };

  const handleClose = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewCategoryName('');
    setNewCategoryColor(defaultColors[0]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Quản lý thẻ phân loại</h2>
              <button
                onClick={handleClose}
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

              {loading ? (
                <div className="text-center py-8 text-gray-400">Đang tải...</div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      {editingId === category._id ? (
                        <>
                          <input
                            type="color"
                            value={editingColor}
                            onChange={(e) => setEditingColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateCategory(category._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                          <span className="flex-1 text-sm font-medium text-gray-900">{category.name}</span>
                          <button
                            onClick={() => handleStartEdit(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Add new category form */}
                  {isAdding && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Tên phân loại..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                      <button
                        onClick={handleAddCategory}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setIsAdding(false);
                          setNewCategoryName('');
                          setNewCategoryColor(defaultColors[0]);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Add new category button */}
              {!isAdding && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAdding(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-lg
                           border-2 border-dashed border-gray-300 hover:border-primary-500
                           text-gray-600 hover:text-primary-500 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">Thêm phân loại</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CategoryModal;
