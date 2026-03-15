import { useState, useRef, type ClipboardEvent, type ChangeEvent } from "react";
import { Smile, SendHorizonal } from "lucide-react";
import { MessageService } from "../../../services";
import type { ChatInputProps } from "../../../types/message.type";
import { EmojiPicker } from "./EmojiPicker";
import { UploadProgress } from "./UploadProgress";
import { ImageInput } from "./ImageInput";
import { FileInput } from "./FileInput";
import { StagingArea } from "./StagingArea";

export const ChatInput = ({
  conversationId,
  senderId,
  onSendSuccess,
}: ChatInputProps) => {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Input ẩn dành riêng cho nút "+" trong StagingArea
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Thêm file vào staging (chưa upload)
  const addToPending = (files: File[]) => {
    setPendingFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => setPendingFiles([]);

  const handleAddMore = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length > 0) addToPending(files);
  };

  // --- Upload helpers (được gọi khi Send) ---

  // Nhiều ảnh → 1 message
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

  // 1 file (video / tệp) → 1 message
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

  // --- Gửi tất cả (file staged + text) ---
  const handleSend = async () => {
    if (isUploading) return;
    if (!text.trim() && pendingFiles.length === 0) return;

    // Upload file staged trước
    if (pendingFiles.length > 0) {
      const files = [...pendingFiles];
      setPendingFiles([]); // xoá staging ngay khi bắt đầu gửi

      const images = files.filter((f) => f.type.startsWith("image/"));
      const others = files.filter((f) => !f.type.startsWith("image/"));

      if (images.length > 0) await uploadImages(images);
      for (const file of others) await uploadSingleFile(file);
    }

    // Sau đó gửi text nếu có
    if (text.trim()) {
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
    }
  };

  // --- Handlers từ sub-components → staging ---

  // Icon ảnh: thêm vào staging
  const handleImageFiles = (files: File[]) => addToPending(files);

  // Icon tệp: thêm vào staging
  const handleAttachFiles = (files: File[]) => addToPending(files);

  // Paste (Ctrl+V): nếu có file → staging, text → paste bình thường
  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      addToPending(files);
    }
  };

  const canSend = (text.trim().length > 0 || pendingFiles.length > 0) && !isUploading;

  return (
    <div
      className="p-4 bg-white border-t border-gray-100 relative"
      onPaste={handlePaste}
    >
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

      {/* Staging area — hiện khi có file chờ gửi */}
      {pendingFiles.length > 0 && (
        <>
          {/* Input ẩn cho nút "+" trong StagingArea */}
          <input
            type="file"
            ref={addMoreInputRef}
            className="hidden"
            accept="*/*"
            multiple
            onChange={handleAddMore}
          />
          <StagingArea
            files={pendingFiles}
            onRemove={handleRemoveFile}
            onClearAll={handleClearAll}
            onAddMore={() => addMoreInputRef.current?.click()}
          />
        </>
      )}

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
          onKeyDown={(e) => e.key === "Enter" && canSend && handleSend()}
          placeholder={isUploading ? "Đang tải lên..." : "Nhập tin nhắn..."}
          disabled={isUploading}
          className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm"
        />

        {canSend && (
          <button
            onClick={handleSend}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-[#EFDCCB] rounded-full transition-colors"
            title="Gửi"
          >
            <SendHorizonal size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
