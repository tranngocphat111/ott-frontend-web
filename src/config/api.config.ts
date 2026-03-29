/**
 * API Configuration
 * Thay đổi API_CHAT_SERVER_URL và SOCKET_CHAT_SERVER_URL ở đây để áp dụng cho toàn bộ app
 */

const AWS_S3_BUCKET_NAME = "riff-storage-iuh";
const AWS_REGION = "ap-southeast-1";

// export const API_CHAT_SERVER_URL = "http://localhost:5000/api";
// export const SOCKET_CHAT_SERVER_URL = "http://localhost:5000";
export const API_MEDIA_SERVER_URL = "http://localhost:8080/media/api";

export const API_CHAT_SERVER_URL =
  "https://abactinal-billy-sportily.ngrok-free.dev/api";
export const SOCKET_CHAT_SERVER_URL =
  "https://abactinal-billy-sportily.ngrok-free.dev";

export const URL_S3 = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/`;
