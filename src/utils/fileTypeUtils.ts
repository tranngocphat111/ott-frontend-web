import {
  FileText, // Cho Word (.doc, .docx)
  FileType2, // Cho TXT (Chuyên về ký tự, đơn giản hơn)
  FileImage, // Ảnh
  FileCode, // Code
  FileJson, // JSON
  FileArchive, // Zip, Rar
  FileSpreadsheet, // Excel
  FileChartColumn, // PowerPoint
  FileVideo, // Video
  FileAudio, // Audio
  File, // Mặc định cho các file khác
} from "lucide-react";
import type { FileTypeData } from "../types/message.type";

export const getFileTypeData = (ext: string): FileTypeData => {
  const extension = ext.toLowerCase().replace(".", "");

  // 1. Ảnh
  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic"].includes(
      extension,
    )
  ) {
    return { Icon: FileImage, color: "text-violet-700", bg: "bg-violet-100" };
  }

  // 2. Video
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(extension)) {
    return { Icon: FileVideo, color: "text-indigo-700", bg: "bg-indigo-100" };
  }

  // 3. Audio
  if (["mp3", "wav", "m4a", "ogg", "flac"].includes(extension)) {
    return { Icon: FileAudio, color: "text-sky-700", bg: "bg-sky-100" };
  }

  // 4. PDF
  if (extension === "pdf") {
    return { Icon: FileText, color: "text-rose-700", bg: "bg-rose-100" };
  }

  // 5. Word (Chuyên nghiệp, nhiều dòng kẻ)
  if (["doc", "docx", "rtf", "odt"].includes(extension)) {
    return { Icon: FileText, color: "text-blue-700", bg: "bg-blue-100" };
  }

  // 6. TXT (Văn bản thuần - Dùng icon có chữ 'T' hoặc icon File đơn giản)
  if (["txt"].includes(extension)) {
    return { Icon: FileType2, color: "text-stone-600", bg: "bg-stone-100" };
  }

  // 7. Excel
  if (["xls", "xlsx", "csv"].includes(extension)) {
    return {
      Icon: FileSpreadsheet,
      color: "text-emerald-700",
      bg: "bg-emerald-100",
    };
  }

  // 8. PowerPoint
  if (["ppt", "pptx", "key", "odp"].includes(extension)) {
    return {
      Icon: FileChartColumn,
      color: "text-orange-700",
      bg: "bg-orange-100",
    };
  }

  // 9. File nén
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return { Icon: FileArchive, color: "text-amber-700", bg: "bg-amber-100" };
  }

  // 10. Code & Data
  if (
    [
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "html",
      "css",
      "java",
      "cpp",
      "go",
    ].includes(extension)
  ) {
    return { Icon: FileCode, color: "text-slate-700", bg: "bg-slate-100" };
  }

  if (["json", "xml", "yaml"].includes(extension)) {
    return { Icon: FileJson, color: "text-slate-700", bg: "bg-slate-100" };
  }

  // Mặc định
  return {
    Icon: File,
    color: "text-zinc-600",
    bg: "bg-zinc-100",
  };
};
