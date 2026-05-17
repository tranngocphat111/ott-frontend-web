const RIFF_API_PATH = "/riff/api";
const LOCAL_GATEWAY_ORIGIN = "http://localhost:8080";
const LOCAL_FRONTEND_ORIGIN = "http://localhost:5173";

export const cleanEnvValue = (value?: string) =>
  (value || "").replace(/^\uFEFF/, "").trim();

export const normalizeBaseUrl = (url: string) =>
  cleanEnvValue(url).replace(/\/+$/, "");

export const stripRiffApiSuffix = (url: string) =>
  normalizeBaseUrl(url).replace(/\/riff\/api$/i, "");

const getBrowserOrigin = () => {
  if (typeof window === "undefined") return "";
  return window.location?.origin || "";
};

export const resolveApiBaseUrl = () => {
  const directUrl = cleanEnvValue(import.meta.env.VITE_API_URL as string | undefined);
  if (directUrl) return normalizeBaseUrl(directUrl);

  const gatewayBase = cleanEnvValue(import.meta.env.VITE_API_BASE_URL as string | undefined);
  if (gatewayBase) return `${normalizeBaseUrl(gatewayBase)}${RIFF_API_PATH}`;

  return import.meta.env.PROD
    ? RIFF_API_PATH
    : `${LOCAL_GATEWAY_ORIGIN}${RIFF_API_PATH}`;
};

export const resolveGatewayBaseUrl = () => {
  const explicitGateway = cleanEnvValue(import.meta.env.VITE_GATEWAY_URL as string | undefined);
  if (explicitGateway) return normalizeBaseUrl(explicitGateway);

  const gatewayBase = stripRiffApiSuffix(resolveApiBaseUrl());
  return gatewayBase || getBrowserOrigin();
};

export const resolveChatSocketUrl = () => {
  const explicitSocket = cleanEnvValue(import.meta.env.VITE_CHAT_SOCKET_URL as string | undefined);
  if (explicitSocket) return normalizeBaseUrl(explicitSocket);

  return resolveGatewayBaseUrl();
};

export const resolveFrontendUrl = () => {
  const configuredFrontendUrl = cleanEnvValue(import.meta.env.VITE_FRONTEND_URL as string | undefined);
  if (configuredFrontendUrl) return normalizeBaseUrl(configuredFrontendUrl);

  return getBrowserOrigin() || LOCAL_FRONTEND_ORIGIN;
};
