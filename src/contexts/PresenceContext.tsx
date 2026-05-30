/**
 * PresenceContext.tsx
 *
 * Global store cho trạng thái online/offline của users.
 * Cung cấp:
 *  - isUserOnline(userId) → boolean
 *  - getLastSeen(userId)  → Date | null
 *  - watchUsers(userIds)  → subscribe thêm users để theo dõi
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { socketService } from "../services";
import { useAuth } from "./AuthContext";
import { parseBackendDate } from "../utils/timeUtils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PresenceEntry {
  isOnline: boolean;
  lastSeenAt: Date | null;
}

interface PresenceContextType {
  /** Kiểm tra xem userId có đang online không */
  isUserOnline: (userId: string) => boolean;
  /** Lấy thời gian hoạt động cuối của userId */
  getLastSeen: (userId: string) => Date | null;
  /** Đăng ký theo dõi thêm danh sách userId */
  watchUsers: (userIds: string[]) => void;
  /** Cập nhật thủ công (dùng khi load dữ liệu từ API) */
  setPresenceFromApi: (userId: string, isOnline: boolean, lastSeenAt?: string | null) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
interface PresenceProviderProps {
  children: ReactNode;
}

export const PresenceProvider: React.FC<PresenceProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Map<userId, PresenceEntry>
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceEntry>>(new Map());
  // Tracked user IDs để tránh query trùng
  const watchedRef = useRef<Set<string>>(new Set());
  // Batch query debounce
  const pendingBatchRef = useRef<string[]>([]);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const updateEntry = useCallback((userId: string, entry: Partial<PresenceEntry>) => {
    setPresenceMap((prev) => {
      const existing = prev.get(userId) ?? { isOnline: false, lastSeenAt: null };
      const next = new Map(prev);
      next.set(userId, { ...existing, ...entry });
      return next;
    });
  }, []);

  // ─── Socket Listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    // Nhận kết quả batch query trạng thái
    const onPresenceResult = (result: { userId: string; isOnline: boolean; lastSeenAt?: string | null }[]) => {
      setPresenceMap((prev) => {
        const next = new Map(prev);
        result.forEach(({ userId, isOnline, lastSeenAt }) => {
          const existing = next.get(userId) ?? { isOnline: false, lastSeenAt: null };
          next.set(userId, { 
            ...existing, 
            isOnline,
            lastSeenAt: parseBackendDate(lastSeenAt) ?? existing.lastSeenAt
          });
        });
        return next;
      });
    };

    // Nhận real-time presence changes
    const onPresenceChanged = (payload: {
      userId: string;
      isOnline: boolean;
      lastSeenAt: string | null;
    }) => {
      updateEntry(payload.userId, {
        isOnline: payload.isOnline,
        lastSeenAt: parseBackendDate(payload.lastSeenAt),
      });
    };

    socketService.onPresenceResult(onPresenceResult);
    socketService.onPresenceChanged(onPresenceChanged);

    const refreshWatchedPresence = () => {
      if (document.visibilityState === "hidden") return;

      const watchedUserIds = Array.from(watchedRef.current);
      if (watchedUserIds.length > 0) {
        socketService.queryPresence(watchedUserIds);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshWatchedPresence();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", refreshWatchedPresence);
    window.addEventListener("online", refreshWatchedPresence);

    return () => {
      socketService.offPresenceResult(onPresenceResult);
      socketService.offPresenceChanged(onPresenceChanged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", refreshWatchedPresence);
      window.removeEventListener("online", refreshWatchedPresence);
    };
  }, [isAuthenticated, updateEntry]);

  // ─── API ────────────────────────────────────────────────────────────────────
  const isUserOnline = useCallback(
    (userId: string): boolean => {
      if (!userId) return false;
      return presenceMap.get(userId)?.isOnline ?? false;
    },
    [presenceMap]
  );

  const getLastSeen = useCallback(
    (userId: string): Date | null => {
      if (!userId) return null;
      return presenceMap.get(userId)?.lastSeenAt ?? null;
    },
    [presenceMap]
  );

  /**
   * watchUsers: Thêm userIds vào danh sách theo dõi và query server.
   * Dùng batch + debounce để tránh spam socket.
   */
  const watchUsers = useCallback(
    (userIds: string[]) => {
      if (!isAuthenticated || userIds.length === 0) return;

      // Lọc ra những userId chưa được theo dõi
      const newIds = userIds.filter((id) => id && !watchedRef.current.has(id));
      if (newIds.length === 0) return;

      newIds.forEach((id) => watchedRef.current.add(id));
      pendingBatchRef.current.push(...newIds);

      // Debounce: gộp batch 100ms rồi gửi 1 lần
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      batchTimerRef.current = setTimeout(() => {
        const batch = pendingBatchRef.current;
        pendingBatchRef.current = [];
        if (batch.length > 0) {
          socketService.queryPresence(batch);
        }
      }, 100);
    },
    [isAuthenticated]
  );

  const setPresenceFromApi = useCallback(
    (userId: string, isOnline: boolean, lastSeenAt?: string | null) => {
      if (!userId) return;
      updateEntry(userId, {
        isOnline,
        lastSeenAt: parseBackendDate(lastSeenAt),
      });
    },
    [updateEntry]
  );

  return (
    <PresenceContext.Provider
      value={{ isUserOnline, getLastSeen, watchUsers, setPresenceFromApi }}
    >
      {children}
    </PresenceContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const usePresence = (): PresenceContextType => {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error("usePresence must be used within <PresenceProvider>");
  }
  return ctx;
};
