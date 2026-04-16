/**
 * API Configuration
 * Thay đổi API_CHAT_SERVER_URL và SOCKET_CHAT_SERVER_URL ở đây để áp dụng cho toàn bộ app
 */

const AWS_S3_BUCKET_NAME = "riff-storage-iuh";
const AWS_REGION = "ap-southeast-1";

export const API_CHAT_SERVER_URL = "http://192.168.5.170:5000/api";
export const SOCKET_CHAT_SERVER_URL = "http://192.168.5.170:5000";
export const API_MEDIA_SERVER_URL = "http://192.168.5.171:8090/media/api";
export const SOCKET_RELATIONSHIP_SERVER_URL = (
  import.meta.env.VITE_RELATIONSHIP_SOCKET_URL || ""
).trim();
export const SOCKET_MEDIA_SERVER_URL = (
  import.meta.env.VITE_MEDIA_SOCKET_URL || SOCKET_RELATIONSHIP_SERVER_URL
).trim();

// export const API_CHAT_SERVER_URL =
//   "https://abactinal-billy-sportily.ngrok-free.dev/api";
// export const SOCKET_CHAT_SERVER_URL =
//   "https://abactinal-billy-sportily.ngrok-free.dev";

export const URL_S3 = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`;
