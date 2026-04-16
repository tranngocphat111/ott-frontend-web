import React from "react";
import { Image, MapPin, Smile, Tag } from "lucide-react";

interface AddToPostToolbarProps {
  onAddMedia: () => void;
  onToggleFeeling: () => void;
  isFeelingActive: boolean;
}

const AddToPostToolbar: React.FC<AddToPostToolbarProps> = ({
  onAddMedia,
  onToggleFeeling,
  isFeelingActive,
}) => {
  return (
    <div className="mx-4 mb-3 border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">
        Thêm vào bài viết
      </span>
      <div className="flex items-center gap-0.5">
        <button
          onClick={onAddMedia}
          title="Ảnh / Video"
          className="p-2 hover:bg-gray-100 rounded-full transition">
          <Image className="size-5 text-green-500" />
        </button>
        <button
          title="Cảm xúc / Hoạt động"
          onClick={onToggleFeeling}
          className={`p-2 rounded-full transition ${
            isFeelingActive ?
              "bg-yellow-100 text-yellow-500"
            : "hover:bg-gray-100 text-yellow-500"
          }`}>
          <Smile className="size-5" />
        </button>
        <button
          title="Check in"
          className="p-2 hover:bg-gray-100 rounded-full transition">
          <MapPin className="size-5 text-red-500" />
        </button>
        <button
          title="Gắn thẻ bạn bè"
          className="p-2 hover:bg-gray-100 rounded-full transition">
          <Tag className="size-5 text-blue-500" />
        </button>
      </div>
    </div>
  );
};

export default AddToPostToolbar;
