import React, { useState } from "react";
import { Plus } from "lucide-react";

interface DropZoneProps {
  onDropFiles: (files: FileList | null) => void;
  onPickFiles: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onDropFiles, onPickFiles }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        onDropFiles(e.dataTransfer.files);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onClick={onPickFiles}
      className={`mx-4 mb-3 h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition ${
        isDragging ?
          "border-primary-500 bg-primary-50"
        : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
      }`}>
      <Plus className="size-8 text-gray-400 mb-1" />
      <p className="text-sm font-medium text-gray-600">Thêm ảnh / video</p>
      <p className="text-xs text-gray-400 mt-0.5">hoặc kéo và thả vào đây</p>
    </div>
  );
};

export default DropZone;
