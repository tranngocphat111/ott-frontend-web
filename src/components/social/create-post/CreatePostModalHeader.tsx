import React from "react";
import { X } from "lucide-react";

interface CreatePostModalHeaderProps {
  onClose: () => void;
  title?: string;
}

const CreatePostModalHeader: React.FC<CreatePostModalHeaderProps> = ({
  onClose,
  title = "Tạo bài viết",
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <div className="w-8" />
      <h2 className="font-bold text-lg text-gray-900">{title}</h2>
      <button
        onClick={onClose}
        className="size-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition">
        <X className="size-4 text-gray-700" />
      </button>
    </div>
  );
};

export default CreatePostModalHeader;
