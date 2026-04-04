import React from "react";
import { Loader2, ImageIcon } from "lucide-react";

interface PhotosTabProps {
  photoUrls: string[];
  loading: boolean;
}

const PhotosTab: React.FC<PhotosTabProps> = ({ photoUrls, loading }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Ảnh</h2>
      {loading ?
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-primary-400" />
        </div>
      : photoUrls.length === 0 ?
        <div className="flex flex-col items-center py-12 text-gray-400 gap-3">
          <ImageIcon className="size-12 opacity-40" />
          <p className="text-sm">Chưa có ảnh nào</p>
        </div>
      : <div className="grid grid-cols-3 gap-1.5">
          {photoUrls.map((url, i) => (
            <div
              key={i}
              className="aspect-square overflow-hidden rounded-xl cursor-pointer group relative">
              <img
                src={url}
                alt=""
                className="size-full object-cover transition group-hover:scale-105 duration-200"
              />
            </div>
          ))}
        </div>
      }
    </div>
  );
};

export default PhotosTab;
