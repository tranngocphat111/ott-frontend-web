import { useState } from "react";
import { Smile, SendHorizonal } from "lucide-react";
import { MessageService } from "../../../services";
import type { ChatInputProps } from "../../../types/message.type";
import { EmojiPicker } from "./EmojiPicker";
import { UploadProgress } from "./UploadProgress";
import { ImageInput } from "./ImageInput";
import { FileInput } from "./FileInput";

export const ChatInput = ({
  conversationId,
  senderId,
  onSendSuccess,
}: ChatInputProps) => {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // --- Gửi text ---
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
    } catch {
      alert("Gửi tin nhắn thất bại");
    }
  };

  // --- Upload nhiều ảnh → 1 message với mảng keys ---
  const uploadImages = async (files: File[]) => {
    const MAX = 50 * 1024 * 1024;
    const valid = files.filter((f) => {
      if (f.size > MAX) {
        alert(`"${f.name}" quá lớn (giới hạn 50MB).`);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    try {
      const keys = await Promise.all(
        valid.map(async (file) => {
          const { uploadUrl, key } = await MessageService.getPresignedUrl(
            file.name,
            file.type,
          );
          await MessageService.uploadFileToS3(uploadUrl, file);
          return key;
        }),
      );
      setUploadProgress(80);
      await MessageService.sendMessage(
        conversationId,
        senderId,
        keys,
        "image",
        0,
      );
      setUploadProgress(100);
      onSendSuccess();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi upload ảnh. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // --- Upload 1 file (video / tệp) → 1 message riêng ---
  const uploadSingleFile = async (file: File) => {
    const MAX = 50 * 1024 * 1024;
    if (file.size > MAX) {
      alert(`"${file.name}" quá lớn (giới hạn 50MB).`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    try {
      const { uploadUrl, fileCategory, key } =
        await MessageService.getPresignedUrl(file.name, file.type);
      setUploadProgress(40);
      await MessageService.uploadFileToS3(uploadUrl, file);
      setUploadProgress(70);
      await MessageService.sendMessage(
        conversationId,
        senderId,
        key,
        fileCategory,
        file.size,
        file.name,
      );
      setUploadProgress(100);
      onSendSuccess();
    } catch (err) {
      console.error(err);
      alert(`Lỗi khi upload "${file.name}".`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // --- Handlers nhận File[] từ sub-components ---

  // Icon ảnh: tất cả đều là ảnh → 1 message
  const handleImageFiles = (files: File[]) => {
    uploadImages(files);
  };

  // Icon tệp: phân loại ảnh vs video/file
  // ảnh → gom 1 message, video/file → mỗi cái 1 message (tuần tự)
  const handleAttachFiles = (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    const others = files.filter((f) => !f.type.startsWith("image/"));
    const run = async () => {
      if (images.length > 0) await uploadImages(images);
      for (const file of others) await uploadSingleFile(file);
    };
    run();
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100 relative">
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={(emoji) => {
            setText((prev) => prev + emoji);
            setShowEmojiPicker(false);
          }}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {isUploading && <UploadProgress progress={uploadProgress} />}

      <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-full border border-gray-200">
        <ImageInput
          disabled={isUploading}
          isUploading={isUploading}
          onFiles={handleImageFiles}
        />

        <FileInput disabled={isUploading} onFiles={handleAttachFiles} />

        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={isUploading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          title="Chọn emoji"
        >
          <Smile size={20} />
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !isUploading && handleSendText()
          }
          placeholder={isUploading ? "Đang tải lên..." : "Nhập tin nhắn..."}
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
