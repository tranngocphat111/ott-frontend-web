export interface NavigationSidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

export interface NavigationItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

export interface NavigationItemProps {
  item: NavigationItem;
  onItemClick?: (itemId: string) => void;
}
