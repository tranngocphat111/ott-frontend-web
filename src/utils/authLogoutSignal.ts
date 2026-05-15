export const AUTH_LOGOUT_EVENT = "auth:logout";
export const AUTH_LOGOUT_SIGNAL_KEY = "riff_auth_logout_signal";

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

export const isAuthLogoutStorageEvent = (event: StorageEvent) =>
  event.key === AUTH_LOGOUT_SIGNAL_KEY && Boolean(event.newValue);
