import React, { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { notificationService, type InAppNotification } from "../../services/notification.service";
import { socketService } from "../../services/socket.service";

const NotificationMenu: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }

    const handleNewNotification = (notification: any) => {
      // notification from socket might not match InAppNotification exactly, but should have similar fields
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socketService.onNewNotification(handleNewNotification);

    return () => {
      socketService.offNewNotification(handleNewNotification);
    };
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const loadNotifications = async () => {
    if (!user?.id) return;
    const data = await notificationService.getNotifications(user.id);
    // Sort by created at descending
    const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setNotifications(sorted);
    setUnreadCount(sorted.filter(n => !n.isRead).length);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await notificationService.markAsRead(notificationId);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="relative z-[300]" ref={menuRef}>
      <button
        onClick={() => setShowMenu((value) => !value)}
        className={`p-3 rounded-xl transition-all duration-200 relative ${
          showMenu ? "bg-primary-50 text-primary-500" : "text-gray-600 hover:bg-gray-100 hover:text-primary-500"
        }`}
        title="Thông báo"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {showMenu && (
        <div className="absolute bottom-12 left-0 z-[300] w-80 overflow-hidden rounded-2xl border border-[#ead9cc] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#f1e4d7] px-4 py-3 bg-[#fffaf6]">
            <p className="text-sm font-semibold text-[#5f432c]">Thông báo</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-3 border-b border-gray-100 flex items-start gap-3 hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? "bg-blue-50/50" : ""
                  }`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="text-primary-400 hover:text-primary-600"
                      title="Đánh dấu đã đọc"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
