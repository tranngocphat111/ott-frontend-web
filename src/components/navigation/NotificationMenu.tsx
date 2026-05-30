import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellRing, CheckCircle2, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  notificationService,
  type InAppNotification,
} from "../../services/notification.service";
import { socketService } from "../../services/socket.service";
import { UserService } from "../../services/user.service";
import Avatar from "../common/Avatar";
import { getFullUrl } from "../../utils/fileUtils";

type SenderProfile = {
  name?: string;
  avatar?: string;
};

type RichNotification = InAppNotification & {
  senderName?: string;
  senderFullName?: string;
  senderAvatar?: string;
  senderAvatarUrl?: string;
  avatar?: string;
  avatarUrl?: string;
  actorName?: string;
  actorAvatar?: string;
  actorAvatarUrl?: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
  referenceId?: string;
};

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getNestedString = (
  notification: RichNotification,
  ...keys: string[]
) => {
  const pools = [notification.metadata, notification.data].filter(Boolean);
  for (const pool of pools) {
    for (const key of keys) {
      const value = getString(pool?.[key]);
      if (value) return value;
    }
  }
  return "";
};

const getNotificationKind = (type?: string) => {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("friend") || normalized.includes("relationship")) {
    return "Kết bạn";
  }
  if (normalized.includes("message") || normalized.includes("chat")) {
    return "Tin nhắn";
  }
  if (normalized.includes("call")) {
    return "Cuộc gọi";
  }
  if (normalized.includes("group")) {
    return "Nhóm";
  }
  return "Riff";
};

const isDisplayableNotification = (notification: InAppNotification) => {
  const normalized = String(notification.type || "").toLowerCase();
  return !normalized.includes("message") && !normalized.includes("chat");
};

const formatTime = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Number.isNaN(date.getTime())) return "";
  if (diffMs < minute) return "Vừa xong";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} phút trước`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} giờ trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [senderProfiles, setSenderProfiles] = useState<
    Record<string, SenderProfile>
  >({});
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const loadNotifications = async () => {
    if (!user?.id) return;
    const data = await notificationService.getNotifications(user.id);
    const sorted = data.filter(isDisplayableNotification).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setNotifications(sorted);
  };

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }

    const handleNewNotification = (notification: InAppNotification) => {
      if (!isDisplayableNotification(notification)) return;
      setNotifications((prev) => [notification, ...prev]);
    };

    socketService.onNewNotification(handleNewNotification);

    return () => {
      socketService.offNewNotification(handleNewNotification);
    };
  }, [user?.id]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const missingSenderIds = Array.from(
      new Set(
        notifications
          .map((notification) => String(notification.senderId || "").trim())
          .filter(
            (senderId) =>
              senderId &&
              senderId !== String(user?.id || "") &&
              !Object.prototype.hasOwnProperty.call(senderProfiles, senderId),
          ),
      ),
    );

    missingSenderIds.forEach((senderId) => {
      UserService.getUserById(senderId)
        .then((profile) => {
          setSenderProfiles((prev) => ({
            ...prev,
            [senderId]: {
              name: profile?.name || senderId,
              avatar: profile?.avatar || "",
            },
          }));
        })
        .catch(() => {
          setSenderProfiles((prev) => ({
            ...prev,
            [senderId]: { name: senderId, avatar: "" },
          }));
        });
    });
  }, [notifications, senderProfiles, user?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await notificationService.markAsRead(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    }
  };

  const handleDeleteNotification = async (
    notificationId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    const success = await notificationService.deleteNotification(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId),
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;

    const success = await notificationService.markAllAsRead(user.id);
    if (success) {
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
    }
  };

  const handleNotificationClick = (notification: RichNotification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    setShowMenu(false);

    // Look for referenceId in the top level or data/metadata
    const refId = notification.referenceId || notification.data?.referenceId || notification.metadata?.referenceId;
    const type = notification.type;

    if (!refId) return;

    if (type === "NEW_POST" || type === "UPDATE_POST" || type === "POST") {
      navigate(`/social/post/${refId}`);
    } else if (type === "NEW_STORY" || type === "UPDATE_STORY" || type === "STORY") {
      navigate(`/social/story/${refId}`);
    }
  };

  const getSenderName = (notification: RichNotification) => {
    const senderId = String(notification.senderId || "").trim();
    return (
      getString(notification.senderName) ||
      getString(notification.senderFullName) ||
      getString(notification.actorName) ||
      getNestedString(
        notification,
        "senderName",
        "senderFullName",
        "actorName",
        "fromName",
      ) ||
      senderProfiles[senderId]?.name ||
      "Riff"
    );
  };

  const getSenderAvatar = (notification: RichNotification) => {
    const senderId = String(notification.senderId || "").trim();
    const raw =
      getString(notification.senderAvatar) ||
      getString(notification.senderAvatarUrl) ||
      getString(notification.avatar) ||
      getString(notification.avatarUrl) ||
      getString(notification.actorAvatar) ||
      getString(notification.actorAvatarUrl) ||
      getNestedString(
        notification,
        "senderAvatar",
        "senderAvatarUrl",
        "actorAvatar",
        "actorAvatarUrl",
        "avatarUrl",
      ) ||
      senderProfiles[senderId]?.avatar ||
      "";

    return raw ? getFullUrl(raw) : "";
  };

  return (
    <div className="relative z-[90]" ref={menuRef}>
      <button
        onClick={() => setShowMenu((value) => !value)}
        className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${
          showMenu
            ? "bg-primary-500 text-white shadow-md"
            : "text-gray-600 hover:bg-gray-100 hover:text-primary-500"
        }`}
        title="Thông báo"
        aria-label="Thông báo"
      >
        {showMenu ? (
          <BellRing className="h-6 w-6" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_6px_14px_rgba(239,68,68,0.28)]">
            {unreadLabel}
          </span>
        )}
      </button>

      {showMenu && (
        <div className="absolute left-[3.75rem] top-1/2 z-[120] w-[360px] -translate-y-10 overflow-visible">
          <div className="absolute -left-2 top-9 h-4 w-4 rotate-45 border-b border-l border-[#ead9cc] bg-white" />
          <div className="overflow-hidden rounded-2xl border border-[#ead9cc] bg-white shadow-[0_22px_60px_rgba(70,52,33,0.18)]">
            <div className="border-b border-[#f1e4d7] bg-[#fffaf6] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-[#3b2a1c]">
                    Thông báo
                  </p>
                  <p className="text-xs text-[#9a7655]">
                    {unreadCount > 0
                      ? `${unreadCount} thông báo chưa đọc`
                      : "Bạn đã đọc hết thông báo"}
                  </p>
                </div>
                {unreadCount > 0 ? (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="shrink-0 rounded-xl bg-primary-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700"
                  >
                    Đọc tất cả
                  </button>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                    <Bell className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>

            <div className="max-h-[min(520px,calc(100vh-8rem))] overflow-y-auto p-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                    <Bell className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-[#3b2a1c]">
                    Chưa có thông báo
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#9a7655]">
                    Khi có tin nhắn, lời mời hoặc cập nhật mới, chúng sẽ xuất
                    hiện ở đây.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const richNotification = notification as RichNotification;
                  const senderName = getSenderName(richNotification);
                  const senderAvatar = getSenderAvatar(richNotification);
                  const kind = getNotificationKind(notification.type);

                  return (
                    <div
                      key={notification.id}
                      className={`group flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-colors duration-150 ${
                        !notification.isRead
                          ? "bg-primary-50"
                          : "hover:bg-[#fbf6f1]"
                      }`}
                      onClick={() => handleNotificationClick(richNotification)}
                    >
                      <Avatar
                        src={senderAvatar}
                        name={senderName}
                        size={42}
                        className="bg-primary-100 ring-1 ring-primary-100"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-[#2c2118]">
                            {senderName}
                          </p>
                          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-primary-600 ring-1 ring-primary-100">
                            {kind}
                          </span>
                        </div>
                        <p
                          className={`line-clamp-2 text-sm leading-snug ${
                            !notification.isRead
                              ? "font-semibold text-[#4b3828]"
                              : "text-[#6f5947]"
                          }`}
                        >
                          {notification.content}
                        </p>
                        <p className="mt-1.5 text-xs text-[#a78b72]">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 self-center">
                        {!notification.isRead && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="rounded-lg p-1.5 text-primary-500 transition-colors hover:bg-white hover:text-primary-700"
                            title="Đánh dấu đã đọc"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(event) =>
                            handleDeleteNotification(notification.id, event)
                          }
                          className="rounded-lg p-1.5 text-red-400 opacity-70 transition-colors hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
