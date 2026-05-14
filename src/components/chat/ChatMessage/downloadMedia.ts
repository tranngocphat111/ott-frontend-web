import { API_CHAT_SERVER_URL } from "../../../config/api.config";
import { authFetch } from "../../../services/api/fetchClient";
import { getFullUrl } from "../../../utils";

const sanitizeDownloadName = (fileName: string) =>
  (fileName || `download-${Date.now()}`)
    .replace(/[\\/:*?"<>|]+/g, "_")
    .trim() || `download-${Date.now()}`;

export const downloadChatMedia = async (
  url: string,
  fileName: string,
): Promise<void> => {
  const normalizedUrl = getFullUrl(url);
  const safeFileName = sanitizeDownloadName(fileName);
  const downloadUrl = `${API_CHAT_SERVER_URL}/media/download?fileUrl=${encodeURIComponent(
    normalizedUrl,
  )}&fileName=${encodeURIComponent(safeFileName)}`;

  const response = await authFetch(downloadUrl, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Không thể tải file (${response.status})`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = safeFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};
