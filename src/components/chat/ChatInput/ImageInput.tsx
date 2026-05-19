import { useRef, type ChangeEvent } from "react";
import { ImageIcon, Loader2 } from "lucide-react";

interface ImageInputProps {
  disabled: boolean;
  isUploading: boolean;
  onFiles: (files: File[]) => void;
}

export const ImageInput = ({
  disabled,
  isUploading,
  onFiles,
}: ImageInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length > 0) onFiles(files);
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="shrink-0 p-2 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
        title="Gửi ảnh (nhiều ảnh = 1 tin nhắn)"
      >
        {isUploading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <ImageIcon size={20} />
        )}
      </button>
    </>
  );
};
