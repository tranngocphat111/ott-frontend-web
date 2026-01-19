import type { Category } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export class CategoryService {
  /**
   * Get all categories for a user
   */
  static async getUserCategories(userId: string): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(data: {
    userId: string;
    name: string;
    color: string;
    order: number;
  }): Promise<Category> {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update an existing category
   */
  static async updateCategory(
    categoryId: string,
    data: {
      name?: string;
      color?: string;
      order?: number;
    }
  ): Promise<Category> {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update category');
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete a category
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Reorder categories
   */
  static async reorderCategories(categories: Array<{ _id: string; order: number }>): Promise<void> {
    try {
      const updatePromises = categories.map((cat) =>
        this.updateCategory(cat._id, { order: cat.order })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error reordering categories:', error);
      throw error;
    }
  }
}
