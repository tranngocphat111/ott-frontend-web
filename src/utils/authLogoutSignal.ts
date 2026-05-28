export const AUTH_LOGOUT_EVENT = "auth:logout";
export const AUTH_LOGOUT_SIGNAL_KEY = "riff_auth_logout_signal";
export const MANUAL_LOGOUT_KEY = "riff_manual_logout_in_progress";
export const FORCED_LOGOUT_NOTICE_KEY = "riff_forced_logout_notice";
export const FORCED_LOGOUT_NOTICE_MESSAGE =
  "Tài khoản của bạn vừa được đăng nhập ở thiết bị khác. Phiên hiện tại đã được đăng xuất để bảo vệ tài khoản.";

const MANUAL_LOGOUT_TTL_MS = 30000;
const FORCED_LOGOUT_NOTICE_TTL_MS = 30 * 60 * 1000;

type ForcedLogoutNotice = {
  type: "forced-logout";
  message: string;
  at: number;
};

export const emitAuthLogoutSignal = () => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  localStorage.setItem(
    AUTH_LOGOUT_SIGNAL_KEY,
    JSON.stringify({
      at: Date.now(),
      nonce: Math.random().toString(36).slice(2),
    }),
  );
};

export const rememberForcedLogoutNotice = (
  message = FORCED_LOGOUT_NOTICE_MESSAGE,
) => {
  if (typeof window === "undefined") return;
  if (isManualLogoutInProgress()) return;
  localStorage.setItem(
    FORCED_LOGOUT_NOTICE_KEY,
    JSON.stringify({
      type: "forced-logout",
      message,
      at: Date.now(),
    } satisfies ForcedLogoutNotice),
  );
};

export const getForcedLogoutNotice = () => {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(FORCED_LOGOUT_NOTICE_KEY);
  if (!raw) return null;

  try {
    const notice = JSON.parse(raw) as Partial<ForcedLogoutNotice>;
    const isValidNotice =
      notice.type === "forced-logout" &&
      typeof notice.message === "string" &&
      typeof notice.at === "number";

    if (!isValidNotice || Date.now() - notice.at > FORCED_LOGOUT_NOTICE_TTL_MS) {
      localStorage.removeItem(FORCED_LOGOUT_NOTICE_KEY);
      return null;
    }

    return notice.message;
  } catch {
    localStorage.removeItem(FORCED_LOGOUT_NOTICE_KEY);
    return null;
  }
};

export const clearForcedLogoutNotice = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FORCED_LOGOUT_NOTICE_KEY);
};

export const beginManualLogout = () => {
  if (typeof window === "undefined") return;
  clearForcedLogoutNotice();
  localStorage.setItem(MANUAL_LOGOUT_KEY, String(Date.now()));
};

export const endManualLogout = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MANUAL_LOGOUT_KEY);
};

export const isManualLogoutInProgress = () => {
  if (typeof window === "undefined") return false;

  const raw = localStorage.getItem(MANUAL_LOGOUT_KEY);
  const startedAt = raw ? Number(raw) : 0;
  if (!startedAt || Number.isNaN(startedAt)) {
    localStorage.removeItem(MANUAL_LOGOUT_KEY);
    return false;
  }

  if (Date.now() - startedAt > MANUAL_LOGOUT_TTL_MS) {
    localStorage.removeItem(MANUAL_LOGOUT_KEY);
    return false;
  }

  return true;
};

export const isAuthLogoutStorageEvent = (event: StorageEvent) =>
  event.key === AUTH_LOGOUT_SIGNAL_KEY && Boolean(event.newValue);
