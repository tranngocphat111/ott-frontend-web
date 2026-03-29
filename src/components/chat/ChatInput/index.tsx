import {
  useState,
  useRef,
  useEffect,
  type ClipboardEvent,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  Smile,
  SendHorizonal,
  CornerUpLeft,
  X,
  Mic,
  Pause,
  Play,
} from "lucide-react";
import { MessageService } from "../../../services";
import type { ChatInputProps } from "../../../types/message.type";
import { EmojiPicker } from "./EmojiPicker";
import { UploadProgress } from "./UploadProgress";
import { ImageInput } from "./ImageInput";
import { FileInput } from "./FileInput";
import { StagingArea } from "./StagingArea";

const FILE_ACCEPT_TYPES =
  "image/*,video/*,audio/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.txt,.json,.csv,.zip,.rar,.7z,.tar,.gz,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed,application/gzip,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/ogg,audio/flac,.env,.ini,.conf,.config,.yaml,.yml,.toml,.md,.xml,.log,.js,.ts,.tsx,.jsx,.mjs,.cjs,.py,.java,.cpp,.c,.h,.hpp,.cs,.go,.rs,.php,.rb,.sh,.bat,.ps1,.sql";

const MIME_BY_EXTENSION: Record<string, string> = {
  env: "text/plain",
  ini: "text/plain",
  conf: "text/plain",
  config: "text/plain",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
  toml: "application/toml",
  json: "application/json",
  xml: "application/xml",
  log: "text/plain",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  js: "text/javascript",
  cjs: "text/javascript",
  mjs: "text/javascript",
  ts: "text/plain",
  jsx: "text/plain",
  tsx: "text/plain",
  py: "text/x-python",
  java: "text/x-java-source",
  c: "text/x-c",
  cpp: "text/x-c",
  h: "text/x-c",
  hpp: "text/x-c",
  cs: "text/plain",
  go: "text/plain",
  rs: "text/plain",
  php: "application/x-httpd-php",
  rb: "text/plain",
  sh: "text/x-shellscript",
  bat: "text/plain",
  ps1: "text/plain",
  sql: "application/sql",
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  flac: "audio/flac",
};

const resolveMimeType = (file: File) => {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[ext] || "application/octet-stream";
};

const URL_PATTERN =
  /((https?:\/\/|www\.)[^\s]+|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\/[^\s]*)?)/i;

const normalizeLink = (rawValue: string): string | null => {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const isStandaloneLink = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;

  // Chỉ nhận type link khi toàn bộ message là 1 link/domain.
  const fullMatch = trimmed.match(URL_PATTERN);
  if (!fullMatch || fullMatch[0] !== trimmed) return false;

  const candidate = trimmed.replace(/[),.!?:;]+$/g, "");
  return !!normalizeLink(candidate);
};

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
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

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

  const stopStreamTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Đóng AudioContext và xoá tham chiếu
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (err) {
        console.warn("Lỗi khi đóng AudioContext:", err);
      }
      audioContextRef.current = null;
    }

    gainNodeRef.current = null;
  };

  const clearRecordingTimer = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const startRecordingTimer = () => {
    clearRecordingTimer();
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      stopStreamTracks();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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
    if (replyToMessage.type === "audio") return "[Âm thanh]";
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
          const mimeType = resolveMimeType(file);
          const { uploadUrl, key } = await MessageService.getPresignedUrl(
            file.name,
            mimeType,
          );
          await MessageService.uploadFileToS3(uploadUrl, file, mimeType);
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
      const mimeType = resolveMimeType(file);
      const { uploadUrl, fileCategory, key } =
        await MessageService.getPresignedUrl(file.name, mimeType);
      setUploadProgress(40);
      await MessageService.uploadFileToS3(uploadUrl, file, mimeType);
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
        const messageType = isStandaloneLink(text) ? "link" : "text";
        const messageContent = text;

        await MessageService.sendMessage(
          conversationId,
          senderId,
          messageContent,
          messageType,
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

  // Mic: ghi âm và gửi ngay
  const handleVoiceFile = async (file: File) => {
    if (isUploading) return;
    await uploadSingleFile(file, replyToMessage?.msg_id);
  };

  const startVoiceRecording = async () => {
    if (isUploading || isRecordingVoice) return;

    try {
      clearRecordingTimer();
      stopStreamTracks();
      setRecordingTime(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Tạo AudioContext để xử lý âm lượng
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      audioContextRef.current = audioContext;

      // Tạo các node để xử lý âm thanh
      const sourceNode = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      gainNodeRef.current = gainNode;

      // Tăng âm lượng ghi âm (3x so với bình thường)
      gainNode.gain.value = 3.0;

      // Tạo stream đầu ra với âm thanh được xử lý
      const destinationNode = audioContext.createMediaStreamDestination();

      // Kết nối: nguồn âm thanh → điều chỉnh âm lượng → đầu ra
      sourceNode.connect(gainNode);
      gainNode.connect(destinationNode);

      // Sử dụng stream xử lý cho MediaRecorder
      const processedStream = destinationNode.stream;
      const mediaRecorder = new MediaRecorder(processedStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        clearRecordingTimer();
        stopStreamTracks();
        mediaRecorderRef.current = null;
        setIsVoicePaused(false);
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setIsVoicePaused(false);
      startRecordingTimer();
    } catch (error) {
      console.error("Loi truy cap micro:", error);
      alert("Khong the truy cap micro. Vui long kiem tra quyen cap phep.");
    }
  };

  const togglePauseResumeVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecordingVoice) return;

    try {
      if (recorder.state === "recording") {
        recorder.pause();
        setIsVoicePaused(true);
        clearRecordingTimer();
        return;
      }

      if (recorder.state === "paused") {
        recorder.resume();
        setIsVoicePaused(false);
        startRecordingTimer();
      }
    } catch (error) {
      console.warn("Khong the pause/resume recorder:", error);
    }
  };

  const stopVoiceRecording = () => {
    clearRecordingTimer();
    stopStreamTracks();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch (error) {
        console.warn("Khong the dung recorder:", error);
      }
    }
    mediaRecorderRef.current = null;
    setIsRecordingVoice(false);
    setIsVoicePaused(false);
  };

  const cancelVoiceRecording = () => {
    stopVoiceRecording();
    audioChunksRef.current = [];
    setRecordingTime(0);
    setIsVoicePaused(false);
  };

  const sendVoiceRecording = async () => {
    if (!isRecordingVoice) return;

    stopVoiceRecording();

    setTimeout(async () => {
      if (audioChunksRef.current.length === 0) {
        setRecordingTime(0);
        return;
      }

      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const file = new File([blob], `voice-${timestamp}.webm`, {
        type: "audio/webm",
      });

      audioChunksRef.current = [];
      setRecordingTime(0);
      setIsVoicePaused(false);
      await handleVoiceFile(file);
    }, 100);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(1, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
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
            accept={FILE_ACCEPT_TYPES}
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

      {isRecordingVoice ? (
        <div className="flex items-center gap-2 rounded-2xl bg-primary-50/80 px-2 py-1 ring-1 ring-primary-100 shadow-sm animate-in fade-in zoom-in-95">
          {/* Nút Hủy (Secondary Action) -> Dạng Ghost, tối giản */}
          <button
            onClick={cancelVoiceRecording}
            className="p-2.5 text-primary-400 hover:text-red-500 hover:bg-red-50 rounded-rfull transition-colors"
            title="Hủy ghi âm"
          >
            <X size={18} strokeWidth={2.5} />
            {/* Gợi ý: Bạn có thể đổi <X /> thành <Trash2 /> nhìn sẽ chuyên nghiệp hơn */}
          </button>

          {/* Khu vực trung tâm: Trạng thái & Thời gian (Pill trắng nổi bật) */}
          <div className="flex-1 flex items-center justify-between rounded-full bg-white px-3 py-1.5 shadow-sm border border-primary-100/50">
            <div className="flex items-center gap-3">
              {/* Chấm báo hiệu: Nhấp nháy khi đang ghi, tĩnh khi tạm dừng */}
              <div className="relative flex h-2.5 w-2.5">
                {!isVoicePaused && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isVoicePaused ? "bg-primary-300" : "bg-primary-500"}`}
                ></span>
              </div>

              {/* Thời gian */}
              <span
                className={`text-sm font-semibold tabular-nums ${isVoicePaused ? "text-primary-400" : "text-primary-700"}`}
              >
                {formatRecordingTime(recordingTime)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Text trạng thái - có thể ẩn trên màn hình quá nhỏ (sm:inline-block) */}
              <span
                className={`text-xs font-medium ${isVoicePaused ? "text-primary-400" : "text-primary-600"}`}
              >
                {isVoicePaused ? "Tạm dừng" : "Đang ghi..."}
              </span>

              {/* Nút Play/Pause (Gọn gàng bên cạnh text) */}
              <button
                onClick={togglePauseResumeVoiceRecording}
                className="h-7 w-7 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 hover:text-primary-700 transition-colors flex items-center justify-center ml-1"
                title={isVoicePaused ? "Tiếp tục ghi âm" : "Tạm dừng ghi âm"}
              >
                {isVoicePaused ? (
                  <Play size={13} fill="currentColor" className="ml-0.5" />
                ) : (
                  <Pause size={13} fill="currentColor" />
                )}
              </button>
            </div>
          </div>

          {/* Nút Gửi (Primary Action) -> Nổi bật nhất */}
          <button
            onClick={sendVoiceRecording}
            className="ml-1 h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 transition-colors hover:bg-primary-200 active:bg-primary-300"
            title="Gửi ghi âm"
          >
            <SendHorizonal
              size={18}
              className="translate-x-[1px] translate-y-[0.5px]"
            />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-2xl border border-gray-200">
          <ImageInput
            disabled={isUploading}
            isUploading={isUploading}
            onFiles={handleImageFiles}
          />

          <FileInput disabled={isUploading} onFiles={handleAttachFiles} />

          <button
            onClick={startVoiceRecording}
            disabled={isUploading}
            className="p-2 text-slate-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
            title="Ghi am"
          >
            <Mic size={20} />
          </button>

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
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm resize-none max-h-35 leading-5 py-1.5"
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
      )}
    </div>
  );
};
