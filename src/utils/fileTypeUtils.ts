import {
  FileText,
  Image, // Lưu ý: Lucide export Image, ta đổi tên khi dùng nếu cần
  FileCode,
  FileArchive,
  File,
} from "lucide-react";
import type { FileTypeData } from "../types/message.type";

// Định nghĩa kiểu dữ liệu trả về

export const getFileTypeData = (ext: string): FileTypeData => {
  const extension = ext.toLowerCase();

  // 1. Ảnh
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(extension)) {
    return {
      Icon: Image,
      color: "text-purple-600",
      bg: "bg-purple-100",
    };
  }

  // 2. Tài liệu văn bản (PDF)
  if (["pdf"].includes(extension)) {
    return {
      Icon: FileText,
      color: "text-red-600",
      bg: "bg-red-100",
    };
  }

  // 3. Word / Doc
  if (["doc", "docx", "txt", "rtf"].includes(extension)) {
    return {
      Icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-100",
    };
  }

  // 4. Excel / CSV
  if (["xls", "xlsx", "csv"].includes(extension)) {
    return {
      Icon: FileText,
      color: "text-green-600",
      bg: "bg-green-100",
    };
  }

  // 5. File nén
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return {
      Icon: FileArchive,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    };
  }

  // 6. Code
  if (
    [
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "html",
      "css",
      "json",
      "java",
      "c",
      "cpp",
    ].includes(extension)
  ) {
    return {
      Icon: FileCode,
      color: "text-slate-700",
      bg: "bg-slate-200",
    };
  }

  // Default
  return {
    Icon: File,
    color: "text-gray-600",
    bg: "bg-gray-100",
  };
};
