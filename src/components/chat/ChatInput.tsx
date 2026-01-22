import {
  ImageIcon,
  SendHorizonal,
  Loader2,
  Paperclip,
  Smile,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { MessageService } from "../../services";
import type { ChatInputProps } from "../../types/message.type";
import { EMOJI_PICKER_LIST } from "../../utils/emojiUtils";

export const ChatInput = ({
  conversationId,
  senderId,
  onSendSuccess,
}: ChatInputProps) => {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Ref để kích hoạt input file ẩn
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Đóng emoji picker khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSendText = async () => {
    if (!text.trim()) return;
    try {
      await MessageService.sendMessage(
        conversationId,
        senderId,
        text,
        "text",
        0,
      );
      setText("");
      onSendSuccess();
    } catch (error) {
      alert("Gửi tin nhắn thất bại");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Kiểm tra kích thước file (giới hạn 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      alert("File quá lớn! Vui lòng chọn file nhỏ hơn 50MB");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Bước 1: Xin link từ Backend
      const { uploadUrl, fileUrl } = await MessageService.getPresignedUrl(
        file.name,
        file.type,
      );
      setUploadProgress(30);

      // Bước 2: Upload lên S3
      await MessageService.uploadFileToS3(uploadUrl, file);
      setUploadProgress(70);

      // Bước 3: Xác định loại file
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "file";

      // Bước 4: Lưu vào Database với fileName
      await MessageService.sendMessage(
        conversationId,
        senderId,
        fileUrl,
        type,
        file.size,
        file.name,
      );
      setUploadProgress(100);

      onSendSuccess();
    } catch (error) {
      console.error(error);
      alert("Lỗi khi upload file. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEmojiClick = (emoji: string) => {
    // Chèn emoji vào input để user thấy
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    // Focus vào input sau khi chọn emoji
    inputRef.current?.focus();
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100 relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full mb-2 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
          style={{ width: "360px", maxHeight: "320px" }}
        >
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              Chọn emoji
            </span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <div
            className="grid grid-cols-8 gap-1 overflow-y-auto custom-scrollbar"
            style={{ maxHeight: "240px" }}
          >
            {EMOJI_PICKER_LIST.map((item, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(item.emoji)}
                className="text-2xl p-2 hover:bg-gray-100 rounded transition-colors cursor-pointer flex flex-col items-center justify-center group relative"
                title={`${item.label} - ${item.shortcode}`}
              >
                <span>{item.emoji}</span>
                <span className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {item.shortcode}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {isUploading && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Đang tải lên...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-[#EFDCCB] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-full border border-gray-200">
        {/* Input ảnh/video ẩn */}
        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/*,video/*"
          onChange={handleImageChange}
        />

        {/* Input file ẩn */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="*/*"
          onChange={handleFileChange}
        />

        {/* Nút upload ảnh/video */}
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          title="Tải lên ảnh hoặc video"
        >
          {isUploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <ImageIcon size={20} />
          )}
        </button>

        {/* Nút upload file */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          title="Tải lên file"
        >
          <Paperclip size={20} />
        </button>

        {/* Nút emoji */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={isUploading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          title="Chọn emoji"
        >
          <Smile size={20} />
        </button>

        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !isUploading && handleSendText()
          }
          placeholder={
            isUploading ? "Đang tải file lên..." : "Nhập tin nhắn..."
          }
          disabled={isUploading}
          className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm"
        />

        {text.trim() && !isUploading && (
          <button
            onClick={handleSendText}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-[#EFDCCB] rounded-full transition-colors"
            title="Gửi tin nhắn"
          >
            <SendHorizonal size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
