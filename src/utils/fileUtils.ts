import { URL_S3 } from "../config/api.config";

// 1. Hàm format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 2. Hàm lấy tên file từ URL
export const getFileNameFromUrl = (
  url: string,
  fallback: string = "file",
): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split("/").pop() || fallback;
    // Loại bỏ unique ID prefix (format: uniqueId_filename)
    const match = fileName.match(/^[a-f0-9]+_(.+)$/);
    return match ? match[1] : fileName;
  } catch {
    return fallback;
  }
};

export const getFileExtension = (fileName: string): string => {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toUpperCase() || "FILE" : "FILE";
};

export const getFullUrl = (content: any): string => {
  const path = Array.isArray(content) ? content[0] : content;

  if (!path) return "";

  const normalized = String(path).trim();
  if (!normalized) return "";

  // Keep already absolute URLs untouched.
  if (/^(https?:)?\/\//i.test(normalized)) {
    return normalized;
  }

  // Support in-memory/local sources.
  if (/^(blob:|data:)/i.test(normalized)) {
    return normalized;
  }

  const base = String(URL_S3 || "").replace(/\/$/, "");
  const suffix = normalized.replace(/^\//, "");

  if (!base) return `/${suffix}`;

  return `${base}/${suffix}`;
};
