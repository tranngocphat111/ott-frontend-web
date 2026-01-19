import type { Conversation } from '../types';

// Dữ liệu mẫu để test UI
export const mockConversations: Conversation[] = [
  {
    _id: '1',
    name: 'Nhóm lập trình web',
    type: 'group',
    avatar_url: undefined,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-17T15:45:00Z',
    latestMessage: {
      _id: 'msg1',
      content: 'Hôm nay chúng ta sẽ học React hooks nhé!',
      type: 'text',
      created_at: '2024-01-17T15:45:00Z',
      sender: {
        _id: 'user2',
        display_name: 'Thầy Nguyên',
        avatar_url: undefined
      }
    },
    participants: [
      {
        _id: 'user2',
        display_name: 'Thầy Nguyên',
        role: 'admin',
        status: 'online'
      },
      {
        _id: 'user3',
        display_name: 'Minh',
        role: 'member',
        status: 'offline'
      }
    ]
  },
  {
    _id: '2',
    name: undefined,
    type: 'private',
    avatar_url: undefined,
    created_at: '2024-01-16T09:15:00Z',
    updated_at: '2024-01-17T14:20:00Z',
    latestMessage: {
      _id: 'msg2',
      content: 'Bạn đã xem tin nhắn của mình chưa?',
      type: 'text',
      created_at: '2024-01-17T14:20:00Z',
      sender: {
        _id: 'user4',
        display_name: 'An Nguyễn',
        avatar_url: undefined
      }
    },
    participants: [
      {
        _id: 'user4',
        display_name: 'An Nguyễn',
        role: 'member',
        status: 'online'
      }
    ]
  },
  {
    _id: '3',
    name: 'Dự án OTT',
    type: 'group',
    avatar_url: undefined,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-17T12:30:00Z',
    latestMessage: {
      _id: 'msg3',
      content: 'Backend API đã sẵn sàng để test',
      type: 'text',
      created_at: '2024-01-17T12:30:00Z',
      sender: {
        _id: 'user5',
        display_name: 'Chúc Nguyễn',
        avatar_url: undefined
      }
    },
    participants: [
      {
        _id: 'user5',
        display_name: 'Chúc Nguyễn',
        role: 'admin',
        status: 'online'
      },
      {
        _id: 'user6',
        display_name: 'Trang',
        role: 'member',
        status: 'away'
      }
    ]
  },
  {
    _id: '4',
    name: undefined,
    type: 'private',
    avatar_url: undefined,
    created_at: '2024-01-17T08:45:00Z',
    updated_at: '2024-01-17T11:15:00Z',
    latestMessage: {
      _id: 'msg4',
      content: 'Cảm ơn bạn đã giúp mình!',
      type: 'text',
      created_at: '2024-01-17T11:15:00Z',
      sender: {
        _id: 'user123', // current user
        display_name: 'Bạn',
        avatar_url: undefined
      }
    },
    participants: [
      {
        _id: 'user7',
        display_name: 'Mai Phạm',
        role: 'member',
        status: 'offline'
      }
    ]
  },
  {
    _id: '5',
    name: undefined,
    type: 'private',
    avatar_url: undefined,
    created_at: '2024-01-16T16:30:00Z',
    updated_at: '2024-01-17T09:10:00Z',
    latestMessage: undefined,
    participants: [
      {
        _id: 'user8',
        display_name: 'Hùng Lê',
        role: 'member',
        status: 'online'
      }
    ]
  }
];

export const mockCurrentUser = {
  _id: 'user123',
  display_name: 'Bạn',
  avatar_url: undefined,
  status: 'online'
};

// Mock users for creating groups
export const mockAvailableUsers = [
  {
    _id: 'user2',
    display_name: 'Sang',
    avatar_url: undefined,
    status: 'online'
  },
  {
    _id: 'user3',
    display_name: 'Ba',
    avatar_url: undefined,
    status: 'offline'
  },
  {
    _id: 'user4',
    display_name: 'Me',
    avatar_url: undefined,
    status: 'online'
  },
  {
    _id: 'user5',
    display_name: 'Bác 3',
    avatar_url: undefined,
    status: 'away'
  },
  {
    _id: 'user6',
    display_name: 'Hoài Nhân',
    avatar_url: undefined,
    status: 'online'
  },
  {
    _id: 'user7',
    display_name: '6 Tuấn',
    avatar_url: undefined,
    status: 'offline'
  },
  {
    _id: 'user8',
    display_name: 'Thầy Nguyên',
    avatar_url: undefined,
    status: 'online'
  },
  {
    _id: 'user9',
    display_name: 'Minh',
    avatar_url: undefined,
    status: 'online'
  },
  {
    _id: 'user10',
    display_name: 'An Nguyễn',
    avatar_url: undefined,
    status: 'busy'
  },
  {
    _id: 'user11',
    display_name: 'Chúc Nguyễn',
    avatar_url: undefined,
    status: 'online'
  },
  {
    _id: 'user12',
    display_name: 'Trang',
    avatar_url: undefined,
    status: 'away'
  },
  {
    _id: 'user13',
    display_name: 'Mai Phạm',
    avatar_url: undefined,
    status: 'offline'
  },
  {
    _id: 'user14',
    display_name: 'Hùng Lê',
    avatar_url: undefined,
    status: 'online'
  }
];