/**
 * Navigation configuration constants
 */
export const NAVIGATION_ITEMS = {
  CHAT: 'chat',
  CONTACTS: 'contacts',
  SEARCH: 'search',
  CALLS: 'calls',
  VIDEO: 'video',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
} as const;

export type NavigationItemId = typeof NAVIGATION_ITEMS[keyof typeof NAVIGATION_ITEMS];
