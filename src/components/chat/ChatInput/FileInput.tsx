import { useRef, type ChangeEvent } from "react";
import { Paperclip } from "lucide-react";

interface FileInputProps {
  disabled: boolean;
  onFiles: (files: File[]) => void;
}

export const FileInput = ({ disabled, onFiles }: FileInputProps) => {
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
        accept="*/*"
        multiple
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
        title="Gửi tệp (ảnh/video/file — có thể chọn nhiều)"
      >
        <Paperclip size={20} />
      </button>
    </>
  );
};
