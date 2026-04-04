import { useRef, type ChangeEvent } from "react";
import { Paperclip } from "lucide-react";

interface FileInputProps {
  disabled: boolean;
  onFiles: (files: File[]) => void;
}

const FILE_ACCEPT_TYPES =
  "image/*,video/*,audio/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.txt,.json,.csv,.zip,.rar,.7z,.tar,.gz,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed,application/gzip,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/ogg,audio/flac,.env,.ini,.conf,.config,.yaml,.yml,.toml,.md,.xml,.log,.js,.ts,.tsx,.jsx,.mjs,.cjs,.py,.java,.cpp,.c,.h,.hpp,.cs,.go,.rs,.php,.rb,.sh,.bat,.ps1,.sql";

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
        accept={FILE_ACCEPT_TYPES}
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
