interface UploadProgressProps {
  progress: number;
}

export const UploadProgress = ({ progress }: UploadProgressProps) => (
  <div className="mb-2">
    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
      <span>Đang tải lên...</span>
      <span>{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div
        className="bg-[#EFDCCB] h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);
