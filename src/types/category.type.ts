// Category type - shared across all modal components
export interface Category {
  _id: string;
  name: string;
  color: string;
  order?: number;
  is_default?: boolean;
}
