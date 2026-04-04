import { useEffect, useState } from "react";
import { X, Plus, Play, FileText } from "lucide-react";

interface StagingAreaProps {
  files: File[];
  onRemove: (index: number) => void;
  onClearAll: () => void;
  onAddMore: () => void;
}

// Preview card cho từng file
const FilePreview = ({
  file,
  index,
  onRemove,
}: {
  file: File;
  index: number;
  onRemove: (i: number) => void;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const displayName =
    file.name.length > 14 ? file.name.slice(0, 11) + "..." : file.name;

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  const renderPreview = () => {
    if (isImage && previewUrl) {
      return (
        <img
          src={previewUrl}
          className="w-full h-full object-cover"
          alt="preview"
        />
      );
    }
    if (isVideo) {
      return (
        <div className="w-full h-full bg-purple-500 flex items-center justify-center">
          <Play size={22} className="text-white fill-white" />
        </div>
      );
    }
    if (["doc", "docx"].includes(ext)) {
      return (
        <div className="w-full h-full bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">W</span>
        </div>
      );
    }
    if (ext === "pdf") {
      return (
        <div className="w-full h-full bg-red-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">PDF</span>
        </div>
      );
    }
    if (["xls", "xlsx"].includes(ext)) {
      return (
        <div className="w-full h-full bg-green-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">X</span>
        </div>
      );
    }
    if (["ppt", "pptx"].includes(ext)) {
      return (
        <div className="w-full h-full bg-orange-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">P</span>
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-gray-400 flex items-center justify-center">
        <FileText size={22} className="text-white" />
      </div>
    );
  };

  return (
    <div className="relative flex-shrink-0 flex flex-col items-center gap-1 group w-16 z-0 hover:z-10">
      <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        {renderPreview()}
      </div>
      <span className="text-[10px] text-gray-500 w-16 truncate text-center leading-tight">
        {displayName}
      </span>
      {/* Nút xoá từng file */}
      <button
        onClick={() => onRemove(index)}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-600 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 shadow"
      >
        <X size={10} className="text-white" />
      </button>
    </div>
  );
};

export const StagingArea = ({
  files,
  onRemove,
  onClearAll,
  onAddMore,
}: StagingAreaProps) => {
  const imageCount = files.filter((f) => f.type.startsWith("image/")).length;
  const otherCount = files.length - imageCount;

  const summary = [
    imageCount > 0 ? `${imageCount} ảnh` : "",
    otherCount > 0 ? `${otherCount} file` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">{summary}</span>
        <button
          onClick={onClearAll}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Xoá tất cả
        </button>
      </div>

      {/* Danh sách file preview */}
      <div className="flex gap-2 overflow-x-auto pb-1 pt-2 custom-scrollbar">
        {files.map((file, index) => (
          <FilePreview
            key={`${file.name}-${file.lastModified}-${index}`}
            file={file}
            index={index}
            onRemove={onRemove}
          />
        ))}

        {/* Nút thêm file */}
        <button
          onClick={onAddMore}
          className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-500 transition-colors self-start"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};
