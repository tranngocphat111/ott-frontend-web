/**
 * API Configuration
 * Thay đổi API_CHAT_SERVER_URL và SOCKET_CHAT_SERVER_URL ở đây để áp dụng cho toàn bộ app
 */

import {
  cleanEnvValue,
  resolveApiBaseUrl,
  resolveChatSocketUrl,
  resolveSocketTransports,
} from "./runtime";

const AWS_S3_BUCKET_NAME = "riff-storage-iuh";
const AWS_REGION = "ap-southeast-1";

export const API_BASE_URL = resolveApiBaseUrl();
export const API_CHAT_SERVER_URL = `${API_BASE_URL}/chat`;
export const API_AI_SERVER_URL = `${API_BASE_URL}/ai`;
export const SOCKET_CHAT_SERVER_URL = resolveChatSocketUrl();
export const SOCKET_CHAT_TRANSPORTS = resolveSocketTransports(SOCKET_CHAT_SERVER_URL);
export const API_MEDIA_SERVER_URL = `${API_BASE_URL}/media`;
export const SOCKET_RELATIONSHIP_SERVER_URL =
  cleanEnvValue(import.meta.env.VITE_RELATIONSHIP_SOCKET_URL as string | undefined);
export const SOCKET_MEDIA_SERVER_URL = cleanEnvValue(
  import.meta.env.VITE_MEDIA_SOCKET_URL as string | undefined,
);

// export const API_CHAT_SERVER_URL =
//   "https://abactinal-billy-sportily.ngrok-free.dev/api";
// export const SOCKET_CHAT_SERVER_URL =
//   "https://abactinal-billy-sportily.ngrok-free.dev";

export const URL_S3 = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`;

export const API_NOTIFICATION_SERVER_URL = API_BASE_URL;
