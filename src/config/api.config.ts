/**
 * API Configuration
 * Thay đổi API_CHAT_SERVER_URL và SOCKET_CHAT_SERVER_URL ở đây để áp dụng cho toàn bộ app
 */

const AWS_S3_BUCKET_NAME = "riff-storage-iuh";
const AWS_REGION = "ap-southeast-1";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://192.168.5.124:8080/riff/api";

export const API_CHAT_SERVER_URL = `${API_BASE_URL}/chat`;
export const SOCKET_CHAT_SERVER_URL = API_BASE_URL.replace("/riff/api", "");
export const API_MEDIA_SERVER_URL = `${API_BASE_URL}/media`;
export const SOCKET_RELATIONSHIP_SERVER_URL = import.meta.env.VITE_RELATIONSHIP_SOCKET_URL;
export const SOCKET_MEDIA_SERVER_URL = import.meta.env.VITE_MEDIA_SOCKET_URL;

// export const API_CHAT_SERVER_URL =
//   "https://abactinal-billy-sportily.ngrok-free.dev/api";
// export const SOCKET_CHAT_SERVER_URL =
//   "https://abactinal-billy-sportily.ngrok-free.dev";

export const URL_S3 = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`;
