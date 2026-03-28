import {
  useState,
  useRef,
  type ClipboardEvent,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Smile, SendHorizonal, CornerUpLeft, X } from "lucide-react";
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
  replyToMessage,
  onCancelReply,
}: ChatInputProps) => {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

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

  const resizeTextInput = () => {
    const el = textInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const getReplyPreviewText = () => {
    if (!replyToMessage) return "";
    if (replyToMessage.type === "image") return "[Hình ảnh]";
    if (replyToMessage.type === "video") return "[Video]";
    if (replyToMessage.type === "file") return "[Tệp tin]";

    const raw = Array.isArray(replyToMessage.content)
      ? replyToMessage.content[0]
      : replyToMessage.content;

    return String(raw || "").trim() || "[Tin nhắn]";
  };

  // --- Upload helpers (được gọi khi Send) ---

  // Nhiều ảnh → 1 message
  const uploadImages = async (files: File[], replyToMsgId?: string) => {
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
        undefined,
        replyToMsgId,
      );
      setUploadProgress(100);
      onSendSuccess();
      if (replyToMsgId) onCancelReply?.();
    } catch (err) {
      console.error(err);
      alert("Lỗi khi upload ảnh. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 1 file (video / tệp) → 1 message
  const uploadSingleFile = async (file: File, replyToMsgId?: string) => {
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
        replyToMsgId,
      );
      setUploadProgress(100);
      onSendSuccess();
      if (replyToMsgId) onCancelReply?.();
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

    const replyToMsgId = replyToMessage?.msg_id;

    // Upload file staged trước
    if (pendingFiles.length > 0) {
      const files = [...pendingFiles];
      setPendingFiles([]); // xoá staging ngay khi bắt đầu gửi

      const images = files.filter((f) => f.type.startsWith("image/"));
      const others = files.filter((f) => !f.type.startsWith("image/"));

      if (images.length > 0) await uploadImages(images, replyToMsgId);
      for (const file of others) await uploadSingleFile(file, replyToMsgId);
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
          undefined,
          replyToMsgId,
        );
        setText("");
        if (textInputRef.current) textInputRef.current.style.height = "auto";
        onSendSuccess();
        if (replyToMsgId) onCancelReply?.();
      } catch {
        alert("Gửi tin nhắn thất bại");
      }
    }
  };

  // --- Handlers từ sub-components → staging ---

  // Icon ảnh: upload và gửi ngay (không qua staging)
  const handleImageFiles = async (files: File[]) => {
    if (isUploading || files.length === 0) return;
    await uploadImages(files, replyToMessage?.msg_id);
  };

  // Icon tệp: upload và gửi ngay (ảnh gộp 1 tin; file/video gửi từng tin)
  const handleAttachFiles = async (files: File[]) => {
    if (isUploading || files.length === 0) return;

    const images = files.filter((f) => f.type.startsWith("image/"));
    const others = files.filter((f) => !f.type.startsWith("image/"));

    if (images.length > 0) await uploadImages(images, replyToMessage?.msg_id);
    for (const file of others)
      await uploadSingleFile(file, replyToMessage?.msg_id);
  };

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

  const canSend =
    (text.trim().length > 0 || pendingFiles.length > 0) && !isUploading;

  const handleTextPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text/plain");
    if (!pastedText) return;

    e.preventDefault();
    const target = e.currentTarget;
    const start = target.selectionStart ?? text.length;
    const end = target.selectionEnd ?? text.length;
    const nextValue = text.slice(0, start) + pastedText + text.slice(end);

    setText(nextValue);

    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = start + pastedText.length;
      resizeTextInput();
    });
  };

  const handleTextKeyDown = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) await handleSend();
    }
  };

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

      {replyToMessage && (
        <div className="mb-2 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <CornerUpLeft size={14} className="mt-0.5 text-slate-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-700">
              Trả lời{" "}
              {replyToMessage.sender_id === senderId ? "chính bạn" : "tin nhắn"}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {getReplyPreviewText()}
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            title="Huỷ trả lời"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 bg-gray-50 px-2 py-1.5 rounded-2xl border border-gray-200">
        <ImageInput
          disabled={isUploading}
          isUploading={isUploading}
          onFiles={handleImageFiles}
        />

        <FileInput disabled={isUploading} onFiles={handleAttachFiles} />

        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={isUploading}
          className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors"
          title="Chọn emoji"
        >
          <Smile size={20} />
        </button>

        <textarea
          ref={textInputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            resizeTextInput();
          }}
          onPaste={handleTextPaste}
          onKeyDown={handleTextKeyDown}
          placeholder={isUploading ? "Đang tải lên..." : "Nhập tin nhắn..."}
          disabled={isUploading}
          rows={1}
          className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm resize-none max-h-35 leading-5 py-1"
        />

        {canSend && (
          <button
            onClick={handleSend}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            title="Gửi"
          >
            <SendHorizonal size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
