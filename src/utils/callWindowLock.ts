const ACTIVE_CALL_LOCK_KEY = "riff_active_call_lock";
const ACTIVE_CALL_TTL_MS = 15000;

export interface ActiveCallLock {
  conversationId: string;
  updatedAt: number;
}

const normalizeConversationId = (value?: string) => String(value || "").trim();

const parseLock = (raw: string | null): ActiveCallLock | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ActiveCallLock>;
    const conversationId = normalizeConversationId(parsed.conversationId);
    const updatedAt = Number(parsed.updatedAt || 0);

    if (!conversationId || !Number.isFinite(updatedAt) || updatedAt <= 0) {
      return null;
    }

    return { conversationId, updatedAt };
  } catch {
    return null;
  }
};

export const setActiveCallLock = (conversationId: string) => {
  const normalized = normalizeConversationId(conversationId);
  if (!normalized) return;

  const lock: ActiveCallLock = {
    conversationId: normalized,
    updatedAt: Date.now(),
  };

  localStorage.setItem(ACTIVE_CALL_LOCK_KEY, JSON.stringify(lock));
};

export const clearActiveCallLock = (conversationId?: string) => {
  const current = parseLock(localStorage.getItem(ACTIVE_CALL_LOCK_KEY));
  const normalized = normalizeConversationId(conversationId);

  if (!normalized || !current || current.conversationId === normalized) {
    localStorage.removeItem(ACTIVE_CALL_LOCK_KEY);
  }
};

export const getActiveCallLock = (
  maxAgeMs: number = ACTIVE_CALL_TTL_MS,
): ActiveCallLock | null => {
  const lock = parseLock(localStorage.getItem(ACTIVE_CALL_LOCK_KEY));
  if (!lock) {
    return null;
  }

  const age = Date.now() - lock.updatedAt;
  if (age > maxAgeMs) {
    localStorage.removeItem(ACTIVE_CALL_LOCK_KEY);
    return null;
  }

  return lock;
};

export const getCallOpenBlockReason = (
  targetConversationId: string,
): "same" | "other" | null => {
  const normalizedTarget = normalizeConversationId(targetConversationId);
  if (!normalizedTarget) return null;

  const active = getActiveCallLock();
  if (!active) return null;

  if (active.conversationId === normalizedTarget) {
    return "same";
  }

  return "other";
};
