import type { Conversation, Message } from '../components/HomePage';

export const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Trần Thị B',
    avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=10B981&color=fff',
    lastMessage: 'Chào bạn, hẹn gặp lại nhé!',
    time: '10:30',
    unread: 2,
    online: true
  },
  {
    id: '2',
    name: 'Lê Văn C',
    avatar: 'https://ui-avatars.com/api/?name=Le+Van+C&background=F59E0B&color=fff',
    lastMessage: 'Ok, tôi sẽ gửi file cho bạn',
    time: '09:15',
    unread: 0,
    online: false
  },
  {
    id: '3',
    name: 'Nhóm Dự Án ABC',
    avatar: 'https://ui-avatars.com/api/?name=Team+ABC&background=8B5CF6&color=fff',
    lastMessage: 'Meeting lúc 2h chiều nhé mọi người',
    time: 'Hôm qua',
    unread: 5,
    online: false,
    isGroup: true
  },
  {
    id: '4',
    name: 'Phạm Thị D',
    avatar: 'https://ui-avatars.com/api/?name=Pham+Thi+D&background=EC4899&color=fff',
    lastMessage: 'Cảm ơn bạn nhiều!',
    time: 'Hôm qua',
    unread: 0,
    online: true
  }
];

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '2',
    content: 'Chào bạn!',
    time: '10:25',
    status: 'seen'
  },
  {
    id: '2',
    senderId: '1',
    content: 'Chào bạn, hôm nay có khỏe không?',
    time: '10:26',
    status: 'seen'
  },
  {
    id: '3',
    senderId: '2',
    content: 'Tôi khỏe, cảm ơn bạn. Còn bạn thì sao?',
    time: '10:28',
    status: 'seen'
  },
  {
    id: '4',
    senderId: '1',
    content: 'Tôi cũng tốt. Tuần này mình có hẹn gặp không?',
    time: '10:29',
    status: 'delivered'
  },
  {
    id: '5',
    senderId: '2',
    content: 'Chào bạn, hẹn gặp lại nhé!',
    time: '10:30',
    status: 'sent'
  }
];