import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactElement,
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
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Link2,
  Music,
  ListChecks,
  Sparkles,
  Loader2,
} from "lucide-react";
import { AiService, ConversationService, MessageService } from "../../../services";
import type { ChatInputProps } from "../../../types/message.type";
import {
  convertDisplayShortcodeToEmoji,
  convertEmojiImageMarkupToText,
} from "../../../constants/emoji.constants";
import { socketService } from "../../../services";
import { getFullUrl } from "../../../utils";
import { getFileNameFromUrl } from "../../../utils";
import { compressImageFile } from "../../../utils/imageCompression";
import { useToast } from "../../../contexts/ToastContext";
import { EmojiPicker } from "./EmojiPicker";
import { ImageInput } from "./ImageInput";
import { FileInput } from "./FileInput";
import { StagingArea } from "./StagingArea";
import { TextInput, type TextInputHandle } from "./TextInput";
import type { Message } from "../../../types/message.type";
import { ConfirmModal } from "../../modal/ConfirmModal";
import CreatePollModal from "../Modal/CreatePollModal";

const FILE_ACCEPT_TYPES =
  "image/*,video/*,audio/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.txt,.json,.csv,.zip,.rar,.7z,.tar,.gz,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/x-7z-compressed,application/gzip,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/ogg,audio/flac,.env,.ini,.conf,.config,.yaml,.yml,.toml,.md,.xml,.log,.js,.ts,.tsx,.jsx,.mjs,.cjs,.py,.java,.cpp,.c,.h,.hpp,.cs,.go,.rs,.php,.rb,.sh,.bat,.ps1,.sql";

const MIME_BY_EXTENSION: Record<string, string> = {
  svg: "image/svg+xml",
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

const IMAGE_FILE_EXTENSION_PATTERN = /\.(svg|png|jpe?g|gif|webp|bmp|heic)$/i;

const isImageUploadFile = (file: File) =>
  file.type.startsWith("image/") || IMAGE_FILE_EXTENSION_PATTERN.test(file.name);

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

const getContentValue = (value: unknown): string => {
  if (typeof value === "string") return value;

  if (typeof value === "object" && value) {
    const candidate = value as { text?: string; url?: string; name?: string };
    return String(candidate.text || candidate.url || candidate.name || "");
  }

  return String(value || "");
};

const normalizePreviewText = (value: unknown): string => {
  return convertDisplayShortcodeToEmoji(
    convertEmojiImageMarkupToText(String(value || "")),
  );
};

const createUploadClientId = () =>
  `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const MB = 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE = 50 * MB;
const VIDEO_MAX_FILE_SIZE = 100 * MB;
const IMAGE_UPLOAD_MAX_SIZE_MB = 1.6;
const IMAGE_UPLOAD_MAX_EDGE = 1920;
const S3_MEDIA_VIOLATION_PATTERN =
  /vi phạm|vi pham|policy|moderation|unsafe|malware|virus|accessdenied|access denied|explicit deny/i;

const getMaxUploadSize = (file: File) => {
  if (file.type.startsWith("video/")) {
    return VIDEO_MAX_FILE_SIZE;
  }
  return DEFAULT_MAX_FILE_SIZE;
};

const validateUploadFiles = (files: File[]) => {
  const valid: File[] = [];
  const invalid: Array<{ file: File; maxSizeMb: number }> = [];

  files.forEach((file) => {
    const maxSize = getMaxUploadSize(file);
    if (file.size > maxSize) {
      invalid.push({ file, maxSizeMb: Math.floor(maxSize / MB) });
      return;
    }
    valid.push(file);
  });

  return { valid, invalid };
};

type ConversationCreateResult = {
  _id?: string;
  conversation?: {
    _id?: string;
  };
};

const shouldConvertImageToJpegForModeration = (file: File) => {
  const type = file.type.toLowerCase();
  return (
    type.startsWith("image/") &&
    type !== "image/gif" &&
    type !== "image/svg+xml" &&
    type !== "image/png" &&
    type !== "image/jpeg" &&
    type !== "image/jpg"
  );
};

const optimizeImageForUpload = (file: File) =>
  compressImageFile(file, {
    maxSizeMB: IMAGE_UPLOAD_MAX_SIZE_MB,
    maxWidthOrHeight: IMAGE_UPLOAD_MAX_EDGE,
    fileType: shouldConvertImageToJpegForModeration(file)
      ? "image/jpeg"
      : file.type,
    initialQuality: 0.82,
    useWebWorker: true,
  });

const buildInvalidFilesMessage = (
  invalid: Array<{ file: File; maxSizeMb: number }>,
) => {
  if (invalid.length === 0) return "";
  return "File bạn chọn quá lớn. Kích thước tối đa là 100MB.";
};

export const ChatInput = ({
  conversationId,
  senderId,
  onSendSuccess,
  onUploadStart,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
  onConversationCreated,
  replyToMessage,
  onCancelReply,
  conversationType,
  smartReplies = [],
  smartReplyContextKey = "",
  isSmartReplyLoading = false,
  isSmartReplyOpen = false,
  onSmartReplyToggle,
  onSmartReplyClose,
  onSmartReplySelect,
}: ChatInputProps): ReactElement => {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadLimitModal, setUploadLimitModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "Không tải được file lên",
    message: "",
  });
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [isSTTMode, setIsSTTMode] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [dismissedSmartReplySignature, setDismissedSmartReplySignature] =
    useState("");
  const textInputRef = useRef<TextInputHandle>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const typingActiveRef = useRef(false);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }

      if (typingActiveRef.current) {
        socketService.stopTyping(conversationId, senderId);
        typingActiveRef.current = false;
      }

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

  useEffect(() => {
    setShowEmojiPicker(false);
    const raf = window.requestAnimationFrame(() => {
      textInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [conversationId]);

  useEffect(() => {
    if (!replyToMessage) return;

    const raf = window.requestAnimationFrame(() => {
      textInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [replyToMessage]);

  useEffect(() => {
    const handler = () => {
      textInputRef.current?.focus();
    };

    window.addEventListener("chat:focus-input", handler as EventListener);
    return () => {
      window.removeEventListener("chat:focus-input", handler as EventListener);
    };
  }, []);


  const handleAddMore = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length > 0) addToPending(files);
  };

  const getReplyPreviewText = () => {
    if (!replyToMessage) return "";
    if (replyToMessage.is_deleted) return "Tin nhắn đã bị xóa ở phía bạn";
    if (replyToMessage.is_revoked) return "Tin nhắn đã được thu hồi";
    if (replyToMessage.type === "image") return "[Hình ảnh]";
    if (replyToMessage.type === "video") return "[Video]";
    if (replyToMessage.type === "audio") return "[Âm thanh]";
    if (replyToMessage.type === "file") return "[Tệp tin]";

    const raw = Array.isArray(replyToMessage.content)
      ? replyToMessage.content[0]
      : replyToMessage.content;

    return normalizePreviewText(raw || "[Tin nhắn]").trim() || "[Tin nhắn]";
  };

  const renderReplyPreview = () => {
    if (!replyToMessage) return null;

    if (replyToMessage.is_deleted || replyToMessage.is_revoked) {
      return (
        <div className="text-xs text-slate-500 truncate">
          {getReplyPreviewText()}
        </div>
      );
    }

    if (replyToMessage.type === "image") {
      const imageUrls = (
        Array.isArray(replyToMessage.content)
          ? replyToMessage.content
          : [replyToMessage.content]
      )
        .map((item) => getContentValue(item))
        .filter(Boolean);
      const previewUrl = imageUrls[0] ? getFullUrl(imageUrls[0]) : "";

      return (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 max-w-full">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="reply-image-preview"
              className="w-9 h-9 rounded-md object-cover border border-slate-200"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="w-8 h-8 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center">
              <ImageIcon size={14} className="text-slate-500" />
            </span>
          )}
          <div className="min-w-0 flex flex-col">
            <span className="text-xs text-slate-600 truncate font-medium">
              Ảnh
            </span>
            {imageUrls.length > 0 && (
              <span className="text-[11px] text-slate-500 truncate">
                {imageUrls.length > 1 ? `Cụm ${imageUrls.length} ảnh` : "1 ảnh"}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (replyToMessage.type === "video") {
      const raw = Array.isArray(replyToMessage.content)
        ? replyToMessage.content[0]
        : replyToMessage.content;
      const previewUrl = raw ? getFullUrl(getContentValue(raw)) : "";
      const fileName = raw ? getFileNameFromUrl(previewUrl, "Video") : "Video";

      return (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
          {previewUrl ? (
            <video
              src={previewUrl}
              className="w-10 h-8 rounded-md object-cover border border-slate-200 bg-black"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <span className="w-10 h-8 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center">
              <VideoIcon size={14} className="text-slate-500" />
            </span>
          )}
          <div className="min-w-0 flex flex-col">
            <span className="text-xs text-slate-600 truncate font-medium">
              {fileName}
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              {getReplyPreviewText()}
            </span>
          </div>
        </div>
      );
    }

    if (replyToMessage.type === "file") {
      const raw = Array.isArray(replyToMessage.content)
        ? replyToMessage.content[0]
        : replyToMessage.content;
      const fileName = raw
        ? getFileNameFromUrl(getFullUrl(getContentValue(raw)), "File")
        : "File";

      return (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
          <span className="w-8 h-8 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center">
            <FileText size={14} className="text-slate-500" />
          </span>
          <div className="min-w-0 flex flex-col">
            <span className="text-xs text-slate-600 truncate font-medium">
              {fileName}
            </span>
            <span className="text-[11px] text-slate-500 truncate">Tệp tin</span>
          </div>
        </div>
      );
    }

    if (replyToMessage.type === "audio") {
      const raw = Array.isArray(replyToMessage.content)
        ? replyToMessage.content[0]
        : replyToMessage.content;
      const fileName = raw
        ? getFileNameFromUrl(getFullUrl(raw), "audio")
        : "audio";

      return (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
          <span className="w-8 h-8 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center">
            <Music size={14} className="text-slate-500" />
          </span>
          <div className="min-w-0 flex flex-col">
            <span className="text-xs text-slate-600 truncate font-medium">
              {fileName}
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              Âm thanh
            </span>
          </div>
        </div>
      );
    }

    if (replyToMessage.type === "link") {
      const linkText = Array.isArray(replyToMessage.content)
        ? replyToMessage.content[0]
        : replyToMessage.content;

      return (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
          <span className="w-8 h-8 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center">
            <Link2 size={14} className="text-slate-500" />
          </span>
          <div className="min-w-0 flex flex-col">
            <span className="text-xs text-slate-600 truncate font-medium">
              Liên kết
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              {String(linkText || "")}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="text-xs text-slate-500 truncate">
        {getReplyPreviewText()}
      </div>
    );
  };

  const getReplyTargetName = () => {
    if (!replyToMessage) return "tin nhắn";
    if (String(replyToMessage.sender_id || "") === String(senderId || "")) {
      return "chính mình";
    }
    if (replyToMessage.sender_name) return replyToMessage.sender_name;
    return "tin nhắn";
  };

  const stopTyping = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }

    if (!typingActiveRef.current) return;

    socketService.stopTyping(conversationId, senderId);
    typingActiveRef.current = false;
  }, [conversationId, senderId]);

  const startTyping = useCallback(() => {
    if (!conversationId || !senderId) return;

    if (!typingActiveRef.current) {
      socketService.startTyping(conversationId, senderId);
      typingActiveRef.current = true;
    }

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
    }

    typingStopTimerRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [conversationId, senderId, stopTyping]);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);

      if (value.length > 0) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping],
  );

  useEffect(() => {
    const handleWindowBlur = () => {
      stopTyping();
    };

    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [stopTyping]);

  const normalizeUploadError = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (typeof error === "string" && error.trim()) {
      return error;
    }

    return fallback;
  };

  const showUploadFailure = useCallback(
    (message: string) => {
      if (S3_MEDIA_VIOLATION_PATTERN.test(message)) {
        showToast(message, "warning", "Không tải được media", 4500);
        return;
      }

      alert(`Gửi tin nhắn thất bại: ${message}`);
    },
    [showToast],
  );

  const getRealConversationId = useCallback(async () => {
    if (conversationId.startsWith("VIRTUAL_CONV_")) {
      const targetUserId = conversationId.replace("VIRTUAL_CONV_", "");
      try {
        const result = await ConversationService.getOrCreatePrivateConversation(senderId, targetUserId);
        const conversationResult = result as ConversationCreateResult;
        const realId = conversationResult.conversation?._id || conversationResult._id;
        if (!realId) {
          throw new Error("Không thể tạo hội thoại");
        }
        if (onConversationCreated) {
          onConversationCreated(result);
        }
        return realId;
      } catch (err) {
        console.error("Failed to create conversation lazily:", err);
        throw err;
      }
    }
    return conversationId;
  }, [conversationId, senderId, onConversationCreated]);

  const showUploadLimitModal = (
    invalid: Array<{ file: File; maxSizeMb: number }>,
  ) => {
    const message = buildInvalidFilesMessage(invalid);
    if (!message) return;

    setUploadLimitModal({
      isOpen: true,
      title: "Không tải được file lên",
      message,
    });
  };

  const isAbortError = (error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }
    if (error instanceof Error && error.name === "AbortError") {
      return true;
    }
    return false;
  };

  const buildReplyPreview = useCallback((): Message["reply_to"] => {
    if (!replyToMessage) return null;

    const rawContent = Array.isArray(replyToMessage.content)
      ? String(replyToMessage.content[0] || "")
      : String(replyToMessage.content || "");

    return {
      msg_id: String(replyToMessage.msg_id || replyToMessage._id || ""),
      sender_id: String(replyToMessage.sender_id || ""),
      sender_name: String(replyToMessage.sender_name || ""),
      type: String(replyToMessage.type || "") as "text" | "link" | "image" | "file" | "video" | "audio" | "system_add" | "system_block" | "system_leave" | "system_pin" | "system_unpin" | "call_start" | "call_join" | "call_end" | "call_missed" | "call_cancel" | "call_no_answer" | "poll" | "system_poll",
      content: rawContent,
      raw_content: rawContent,
      file_name: replyToMessage.fileName,
      url: rawContent,
      media_urls: Array.isArray(replyToMessage.content)
        ? replyToMessage.content
          .map((item) => String(item || ""))
          .filter(Boolean)
        : undefined,
      media_count: Array.isArray(replyToMessage.content)
        ? replyToMessage.content.filter(Boolean).length
        : undefined,
      is_deleted: Boolean(replyToMessage.is_deleted),
      is_revoked: Boolean(replyToMessage.is_revoked),
    };
  }, [replyToMessage]);

  const buildLocalDraftMessage = useCallback(({
    clientMessageId,
    type,
    content,
    fileName,
    size,
    previewUrls,
    retry,
    cancel,
  }: {
    clientMessageId: string;
    type: Message["type"];
    content: Message["content"];
    fileName?: string;
    size?: number;
    previewUrls: string[];
    retry: () => Promise<void>;
    cancel?: () => void;
  }): Message => {
    const now = new Date().toISOString();
    return {
      _id: clientMessageId,
      msg_id: clientMessageId,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: "Bạn",
      fileName,
      content,
      type,
      size,
      created_at: now,
      createdAt: now,
      reply_to_msg_id: replyToMessage?.msg_id || null,
      reply_to: buildReplyPreview(),
      reactions: [],
      is_deleted: false,
      is_revoked: false,
      local_client_id: clientMessageId,
      local_status: "uploading",
      local_error: undefined,
      local_upload_progress: 0,
      local_preview_urls: previewUrls,
      local_retry: retry,
      local_cancel: cancel,
    };
  }, [conversationId, senderId, replyToMessage, buildReplyPreview]);

  const inferFileMessageType = (file: File): Message["type"] => {
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "file";
  };

  const uploadImageBatch = useCallback(async (
    files: File[],
    replyToMsgId?: string,
    clientMessageId = createUploadClientId(),
  ) => {
    if (files.length === 0) return;

    const previewUrls = files.map((file) => URL.createObjectURL(file));
    const abortController = new AbortController();

    const retry = async () => {
      await uploadImageBatch(files, replyToMsgId, clientMessageId);
    };

    const cancel = () => {
      abortController.abort();
    };

    const draft = buildLocalDraftMessage({
      clientMessageId,
      type: "image",
      content: previewUrls as unknown as Message["content"],
      previewUrls,
      retry,
      cancel,
    });

    onUploadStart?.(draft);

    try {
      const optimizedFiles = await Promise.all(
        files.map((file) => optimizeImageForUpload(file)),
      );

      const keys = await Promise.all(
        optimizedFiles.map(async (file) => {
          const mimeType = resolveMimeType(file);
          const { uploadUrl, key } = await MessageService.getPresignedUrl(
            file.name,
            mimeType,
            abortController.signal,
          );
          await MessageService.uploadFileToS3(
            uploadUrl,
            file,
            mimeType,
            abortController.signal,
          );
          return key;
        }),
      );

      const effectiveConvId = await getRealConversationId();

      const sentMessage = await MessageService.sendMessage(
        effectiveConvId,
        senderId,
        keys,
        "image",
        optimizedFiles.reduce((sum, file) => sum + file.size, 0),
        undefined,
        replyToMsgId,
        undefined,
        undefined,
        undefined,
        abortController.signal,
      );

      onUploadProgress?.(clientMessageId, 100);
      onUploadSuccess?.({ clientMessageId, sentMessage });

      if (replyToMsgId) onCancelReply?.();
    } catch (error) {
      if (isAbortError(error)) {
        onUploadError?.({ clientMessageId, error: "Đã hủy gửi" });
        return;
      }

      const errorMessage = normalizeUploadError(
        error,
        "Lỗi khi upload ảnh. Vui lòng thử lại!",
      );
      console.error(error);
      onUploadError?.({ clientMessageId, error: errorMessage });
      showUploadFailure(errorMessage);
    } finally {
      previewUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    }
  }, [
    senderId,
    buildLocalDraftMessage,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
    showUploadFailure,
    onCancelReply,
    getRealConversationId,
  ]);

  // --- Upload helpers (được gọi khi Send) ---

  // Nhiều ảnh → 1 message (gửi cụm)
  const uploadImages = useCallback(async (files: File[], replyToMsgId?: string) => {
    await uploadImageBatch(files, replyToMsgId);
  }, [uploadImageBatch]);

  // 1 file (video / tệp) → 1 message
  const uploadSingleFile = useCallback(async (
    file: File,
    replyToMsgId?: string,
    clientMessageId = createUploadClientId(),
  ) => {
    const maxSize = getMaxUploadSize(file);
    if (file.size > maxSize) {
      showUploadLimitModal([{ file, maxSizeMb: Math.floor(maxSize / MB) }]);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const abortController = new AbortController();

    const retry = async () => {
      await uploadSingleFile(file, replyToMsgId, clientMessageId);
    };

    const cancel = () => {
      abortController.abort();
    };

    const localType = inferFileMessageType(file);

    const draft = buildLocalDraftMessage({
      clientMessageId,
      type: localType,
      content: [previewUrl] as unknown as Message["content"],
      fileName: file.name,
      size: file.size,
      previewUrls: [previewUrl],
      retry,
      cancel,
    });

    onUploadStart?.(draft);

    const mimeType = resolveMimeType(file);

    try {
      const { uploadUrl, fileCategory, key } =
        await MessageService.getPresignedUrl(
          file.name,
          mimeType,
          abortController.signal,
        );
      await MessageService.uploadFileToS3(
        uploadUrl,
        file,
        mimeType,
        abortController.signal,
      );
      const effectiveConvId = await getRealConversationId();

      const sentMessage = await MessageService.sendMessage(
        effectiveConvId,
        senderId,
        key,
        fileCategory,
        file.size,
        file.name,
        replyToMsgId,
        undefined,
        undefined,
        undefined,
        abortController.signal,
      );
      onUploadProgress?.(clientMessageId, 100);
      onUploadSuccess?.({ clientMessageId, sentMessage });
      await onSendSuccess(sentMessage);
      if (replyToMsgId) onCancelReply?.();
    } catch (err) {
      if (isAbortError(err)) {
        onUploadError?.({ clientMessageId, error: "Đã hủy gửi" });
        return;
      }

      const errorMessage = normalizeUploadError(
        err,
        `Lỗi khi upload "${file.name}".`,
      );
      console.error(err);
      onUploadError?.({ clientMessageId, error: errorMessage });
      showUploadFailure(errorMessage);
    } finally {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  }, [
    senderId,
    buildLocalDraftMessage,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
    showUploadFailure,
    onCancelReply,
    onSendSuccess,
    getRealConversationId,
  ]);

  // --- Gửi tất cả (file staged + text) ---
  const handleSend = useCallback(async (directText?: string) => {
    const finalText = (typeof directText === 'string' ? directText : text).trim();
    if (isUploading) return;
    if (!finalText && pendingFiles.length === 0) return;

    stopTyping();

    const replyToMsgId = replyToMessage?.msg_id;
    const filesToUpload = [...pendingFiles];
    const { valid: validFiles, invalid: invalidFiles } =
      validateUploadFiles(filesToUpload);
    const hasFiles = validFiles.length > 0;

    if (invalidFiles.length > 0) {
      showUploadLimitModal(invalidFiles);
      return;
    }

    if (hasFiles) {
      setIsUploading(true);
    }

    try {
      if (hasFiles) {
        setPendingFiles([]); // xoá staging ngay khi bắt đầu gửi

        const images = validFiles.filter(isImageUploadFile);
        const others = validFiles.filter((file) => !isImageUploadFile(file));

        const uploadTasks: Promise<unknown>[] = [];
        if (images.length > 0) {
          uploadTasks.push(uploadImages(images, replyToMsgId));
        }
        uploadTasks.push(
          ...others.map((file) => uploadSingleFile(file, replyToMsgId)),
        );

        await Promise.allSettled(uploadTasks);
      }

      // Sau đó gửi text nếu có
      if (finalText) {
        try {
          const messageType = isStandaloneLink(finalText) ? "link" : "text";
          const messageContent = convertEmojiImageMarkupToText(finalText);

          const effectiveConvId = await getRealConversationId();

          const sentMessage = await MessageService.sendMessage(
            effectiveConvId,
            senderId,
            messageContent,
            messageType,
            0,
            undefined,
            replyToMsgId,
          );
          if (typeof directText !== 'string') {
            setText("");
          }
          await onSendSuccess(sentMessage);
          if (replyToMsgId) onCancelReply?.();
        } catch (error: unknown) {
          console.error("Lỗi gửi tin nhắn:", error);
          const message =
            error instanceof Error ? error.message : "Lỗi không xác định";
          alert(`Gửi tin nhắn thất bại: ${message}`);
        }
      }
    } finally {
      if (hasFiles) {
        setIsUploading(false);
      }
    }
  }, [
    text,
    isUploading,
    pendingFiles,
    stopTyping,
    replyToMessage,
    senderId,
    onSendSuccess,
    onCancelReply,
    isSTTMode,
    isRecordingVoice,
    isStandaloneLink,
    getRealConversationId,
    buildLocalDraftMessage,
    validateUploadFiles,
    uploadImages,
    uploadSingleFile,
  ]);

  useEffect(() => {
    const handleSmartReply = (event: Event) => {
      const custom = event as CustomEvent<{ text: string }>;
      const replyText = custom.detail.text;
      if (replyText) {
        // Send directly
        void handleSend(replyText);
      }
    };

    window.addEventListener("chat:send-smart-reply", handleSmartReply as EventListener);
    return () => {
      window.removeEventListener("chat:send-smart-reply", handleSmartReply as EventListener);
    };
  }, [handleSend]);

  // --- Handlers từ sub-components → staging ---

  // Icon ảnh: upload và gửi ngay (không qua staging)
  const handleImageFiles = async (files: File[]) => {
    if (isUploading || files.length === 0) return;

    const { valid, invalid } = validateUploadFiles(files);
    if (invalid.length > 0 || valid.length === 0) {
      if (invalid.length > 0) showUploadLimitModal(invalid);
      return;
    }

    setIsUploading(true);
    try {
      await uploadImages(valid, replyToMessage?.msg_id);
    } finally {
      setIsUploading(false);
    }
  };

  // Icon tệp: upload và gửi ngay (ảnh gộp 1 tin; file/video gửi từng tin)
  const handleAttachFiles = async (files: File[]) => {
    if (isUploading || files.length === 0) return;

    const { valid, invalid } = validateUploadFiles(files);
    if (invalid.length > 0 || valid.length === 0) {
      if (invalid.length > 0) showUploadLimitModal(invalid);
      return;
    }

    setIsUploading(true);
    try {
      const images = valid.filter(isImageUploadFile);
      const others = valid.filter((file) => !isImageUploadFile(file));

      const uploadTasks: Promise<unknown>[] = [];
      if (images.length > 0) {
        uploadTasks.push(uploadImages(images, replyToMessage?.msg_id));
      }
      uploadTasks.push(
        ...others.map((file) => uploadSingleFile(file, replyToMessage?.msg_id)),
      );

      await Promise.allSettled(uploadTasks);
    } finally {
      setIsUploading(false);
    }
  };

  // Mic: ghi âm và gửi ngay
  const handleVoiceFile = async (file: File) => {
    if (isUploading) return;
    setIsUploading(true);
    try {
      await uploadSingleFile(file, replyToMessage?.msg_id);
    } finally {
      setIsUploading(false);
    }
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
      const AudioContextConstructor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextConstructor) {
        throw new Error("Trình duyệt không hỗ trợ AudioContext");
      }
      const audioContext = new AudioContextConstructor();
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

      if (isSTTMode) {
        setIsTranscribing(true);
        try {
          const transcribedText = await AiService.transcribeVoice(blob);
          if (transcribedText) {
            setText(prev => (prev.trim() ? `${prev} ${transcribedText}` : transcribedText));
          }
        } catch (error) {
          console.error("STT Error:", error);
          alert("Không thể chuyển đổi giọng nói thành văn bản. Vui lòng thử lại.");
        } finally {
          setIsTranscribing(false);
          setIsSTTMode(false);
        }
      } else {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const file = new File([blob], `voice-${timestamp}.webm`, {
          type: "audio/webm",
        });
        await handleVoiceFile(file);
      }

      audioChunksRef.current = [];
      setRecordingTime(0);
      setIsVoicePaused(false);
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
    let hasFolder = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        if (typeof item.webkitGetAsEntry === "function") {
          const entry = item.webkitGetAsEntry();
          if (entry && entry.isDirectory) {
            hasFolder = true;
            continue;
          }
        }
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (hasFolder) {
      e.preventDefault();
      setUploadLimitModal({
        isOpen: true,
        title: "Không hỗ trợ gửi thư mục",
        message: "Vui lòng nén thư mục hoặc gửi từng tệp tin riêng lẻ.",
      });
      return;
    }

    if (files.length > 0) {
      e.preventDefault();
      addToPending(files);
    }
  };

  // Kéo thả (Drag & Drop): chặn folder và đưa file vào staging
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const items = e.dataTransfer?.items;
    if (!items) return;

    const files: File[] = [];
    let hasFolder = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        if (typeof item.webkitGetAsEntry === "function") {
          const entry = item.webkitGetAsEntry();
          if (entry && entry.isDirectory) {
            hasFolder = true;
            continue;
          }
        }
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (hasFolder) {
      setUploadLimitModal({
        isOpen: true,
        title: "Không hỗ trợ gửi thư mục",
        message: "Vui lòng nén thư mục hoặc gửi từng tệp tin riêng lẻ.",
      });
      return;
    }

    if (files.length > 0) {
      addToPending(files);
    }
  };

  const handleCreatePoll = async (data: { question: string; options: { id: string; name: string; voters: string[] }[]; multipleChoice: boolean }) => {
    try {
      setIsUploading(true);
      const effectiveConvId = await getRealConversationId();
      await MessageService.sendMessage(
        effectiveConvId,
        senderId,
        "Khảo sát",
        "poll",
        0,
        undefined,
        replyToMessage?.msg_id,
        data.question,
        data.multipleChoice,
        data.options,
      );
      if (replyToMessage) onCancelReply?.();
      onSendSuccess?.();
    } catch (error: unknown) {
      console.error("Lỗi tạo khảo sát:", error);
      alert(error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo khảo sát. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // bắt buộc để cho phép drop
  };

  const canSend =
    (text.trim().length > 0 || pendingFiles.length > 0) && !isUploading;
  const smartReplySignature = smartReplies.join("\u001f");
  const smartReplyDismissKey = smartReplyContextKey || smartReplySignature;
  const shouldShowSmartReplyCue =
    smartReplies.length > 0 &&
    smartReplyDismissKey !== dismissedSmartReplySignature &&
    text.trim().length === 0 &&
    pendingFiles.length === 0 &&
    !replyToMessage &&
    !showEmojiPicker &&
    !isUploading &&
    !isRecordingVoice &&
    !isSmartReplyLoading;
  const shouldShowSmartReplyLoading =
    isSmartReplyLoading &&
    text.trim().length === 0 &&
    pendingFiles.length === 0 &&
    !replyToMessage &&
    !showEmojiPicker &&
    !isUploading &&
    !isRecordingVoice;
  const visibleSmartReplies = isSmartReplyOpen
    ? smartReplies.slice(0, 5)
    : smartReplies.slice(0, 3);
  const hiddenSmartReplyCount = Math.max(
    0,
    smartReplies.length - visibleSmartReplies.length,
  );

  const handleSmartReplySelect = (reply: string) => {
    onSmartReplySelect?.(reply);
  };

  const handleSmartReplyToggle = () => {
    if (isSmartReplyOpen) {
      onSmartReplyClose?.();
    } else {
      onSmartReplyToggle?.();
    }
  };

  const handleDismissSmartReplies = () => {
    setDismissedSmartReplySignature(smartReplyDismissKey);
    onSmartReplyClose?.();
  };

  const handleTextKeyDown = async (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) await handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (import.meta.env.DEV) {
      console.log("[emoji-caret] handleEmojiSelect", {
        emoji,
        textLength: text.length,
        hasInputRef: !!textInputRef.current,
      });
    }

    if (!textInputRef.current) {
      setText((prev) => prev + emoji);
      setShowEmojiPicker(false);
      return;
    }
    textInputRef.current.insertTextAtCaret(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div
      className="chat-composer relative border-t border-gray-100 bg-white p-2 sm:p-4"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      <CreatePollModal
        isOpen={showCreatePollModal}
        onClose={() => setShowCreatePollModal(false)}
        onSubmit={handleCreatePoll}
      />

      <ConfirmModal
        isOpen={uploadLimitModal.isOpen}
        title={uploadLimitModal.title}
        message={uploadLimitModal.message}
        confirmText="Đóng"
        hideCancelButton
        onConfirm={() =>
          setUploadLimitModal((prev) => ({ ...prev, isOpen: false }))
        }
        onCancel={() =>
          setUploadLimitModal((prev) => ({ ...prev, isOpen: false }))
        }
      />

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
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <CornerUpLeft size={14} className="text-slate-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-700">
              Trả lời {getReplyTargetName()}
            </div>
            {renderReplyPreview()}
          </div>
          <button
            onClick={onCancelReply}
            className="self-center p-1 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            title="Huỷ trả lời"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {shouldShowSmartReplyLoading && (
        <div
          className="mb-4 flex h-7 items-center gap-2 rounded-2xl bg-white px-2"
          title="Đang tạo gợi ý trả lời"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-500">
            <Sparkles size={14} />
          </span>
          <div className="flex flex-1 items-center gap-2">
            <Loader2 size={14} className="animate-spin text-primary-500" />
            <div className="h-2 w-24 rounded-full bg-slate-100" />
            <div className="h-2 w-16 rounded-full bg-slate-100" />
            <div className="h-2 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
      )}

      {shouldShowSmartReplyCue && (
        <div className="mb-4 flex h-7 items-center gap-2 overflow-hidden rounded-2xl  bg-white px-2 ">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-500">
            <Sparkles size={14} />
          </span>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleSmartReplies.map((reply, index) => (
              <button
                key={`${reply}-${index}`}
                type="button"
                onClick={() => handleSmartReplySelect(reply)}
                className="h-7  shrink-0 truncate rounded-full border border-slate-200 bg-slate-50 px-3 text-left text-[13px] font-medium text-slate-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800"
                title={reply}
              >
                {reply}
              </button>
            ))}

            {smartReplies.length > 3 && (
              <button
                type="button"
                onClick={handleSmartReplyToggle}
                className="h-7 shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[12px] font-semibold text-slate-600 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                title={isSmartReplyOpen ? "Thu gọn gợi ý" : "Xem thêm gợi ý"}
              >
                {isSmartReplyOpen ? "Thu gọn" : `+${hiddenSmartReplyCount}`}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleDismissSmartReplies}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-600"
            title="Ẩn gợi ý"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {isRecordingVoice ? (
        <div className="flex items-center gap-1.5 rounded-2xl bg-primary-50/80 px-2 py-1 ring-1 ring-primary-100 shadow-sm animate-in fade-in zoom-in-95 sm:gap-2">
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
                {isVoicePaused ? "Tạm dừng" : isSTTMode ? "Đang nghe..." : "Đang ghi..."}
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
            title={isSTTMode ? "Chuyển thành văn bản" : "Gửi ghi âm"}
          >
            {isSTTMode ? (
              <Sparkles size={18} />
            ) : (
              <SendHorizonal
                size={18}
                className="translate-x-px translate-y-[0.5px]"
              />
            )}
          </button>
        </div>
      ) : (
        <div className="chat-composer-bar flex min-w-0 items-center gap-0.5 rounded-2xl border border-gray-200 bg-gray-50 px-1.5 py-1.5 sm:gap-2 sm:px-2">
          <ImageInput
            disabled={isUploading}
            isUploading={isUploading}
            onFiles={handleImageFiles}
          />

          <FileInput disabled={isUploading} onFiles={handleAttachFiles} />

          {conversationType !== "private" && (
            <button
              onClick={() => setShowCreatePollModal(true)}
              disabled={isUploading}
              className="hidden shrink-0 p-2 text-slate-400 transition-colors hover:text-gray-600 disabled:opacity-50 sm:inline-flex"
              title="Tạo khảo sát"
            >
              <ListChecks size={20} />
            </button>
          )}

          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={isUploading}
            className="hidden shrink-0 p-2 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50 sm:inline-flex"
            title="Chọn emoji"
          >
            <Smile size={20} />
          </button>

          <button
            onClick={startVoiceRecording}
            disabled={isUploading}
            className="hidden shrink-0 p-2 text-slate-400 transition-colors hover:text-gray-600 disabled:opacity-50 sm:inline-flex"
            title="Gửi tin nhắn thoại"
          >
            <Mic size={20} />
          </button>

          <button
            onClick={() => {
              setIsSTTMode(true);
              startVoiceRecording();
            }}
            disabled={isUploading || isRecordingVoice}
            className={`hidden shrink-0 rounded-xl p-2 transition-all duration-200 sm:inline-flex ${isTranscribing ? "animate-pulse text-primary-500 bg-primary-50" : "text-slate-400 hover:text-primary-500 hover:bg-primary-50"
              }`}
            title="Nhập liệu bằng giọng nói"
          >
            {isTranscribing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <div className="relative">
                <Mic size={20} />
                <span className="absolute -top-1.5 -right-1.5 text-[7px] font-bold bg-primary-500 text-white px-0.5 rounded-[2px] leading-tight ring-1 ring-white">
                  AI
                </span>
              </div>
            )}
          </button>

          <TextInput
            ref={textInputRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleTextKeyDown}
            onBlur={stopTyping}
            placeholder={isUploading ? "Đang tải lên..." : "Nhập tin nhắn..."}
            disabled={isUploading}
          />

          {canSend && (
            <button
              onClick={() => handleSend()}
              className="shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
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
