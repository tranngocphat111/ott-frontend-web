import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useCallback,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import ContentEditable, {
  type ContentEditableEvent,
} from "react-contenteditable";
import {
  convertEmojiImageMarkupToText,
  convertEmojiTextToImageMarkup,
} from "../../../constants/emoji.constants";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onBlur?: () => void;
  placeholder: string;
  disabled?: boolean;
}

export interface TextInputHandle {
  focus: () => void;
  insertTextAtCaret: (text: string) => void;
}

const EMOJI_SIZE = 18;

export const TextInput = forwardRef<TextInputHandle, TextInputProps>(
  (
    { value, onChange, onKeyDown, onBlur, placeholder, disabled = false },
    ref,
  ) => {
    const editorRef = useRef<HTMLElement | null>(null);
    const htmlRef = useRef(convertEmojiTextToImageMarkup(value, EMOJI_SIZE));
    const caretOffsetRef = useRef<number | null>(null);

    // =========================
    // UTILS & CARET LOGIC
    // =========================

    const computeSelectionOffset = useCallback((): number | null => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection || selection.rangeCount === 0) return null;

      const range = selection.getRangeAt(0);
      if (!editor.contains(range.startContainer)) return null;

      const preRange = document.createRange();
      preRange.selectNodeContents(editor);
      preRange.setEnd(range.startContainer, range.startOffset);

      const temp = document.createElement("div");
      temp.appendChild(preRange.cloneContents());
      return convertEmojiImageMarkupToText(temp.innerHTML).length;
    }, []);

    const restoreCaretFromOffset = useCallback((targetOffset: number) => {
      const editor = editorRef.current;
      const selection = window.getSelection();
      if (!editor || !selection) return;

      const range = document.createRange();
      let remaining = Math.max(0, targetOffset);
      let placed = false;

      const traverse = (node: Node) => {
        if (placed) return;

        if (node.nodeType === Node.TEXT_NODE) {
          const len = node.textContent?.length || 0;
          if (remaining <= len) {
            range.setStart(node, remaining);
            range.collapse(true);
            placed = true;
          } else {
            remaining -= len;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName === "IMG" && el.hasAttribute("data-emoji")) {
            const emojiChar = el.getAttribute("data-emoji") || "";
            const len = emojiChar.length || 1;

            if (remaining === 0) {
              range.setStartBefore(el);
              range.collapse(true);
              placed = true;
            } else if (remaining <= len) {
              range.setStartAfter(el);
              range.collapse(true);
              placed = true;
            } else {
              remaining -= len;
            }
          } else {
            node.childNodes.forEach(traverse);
          }
        }
      };

      traverse(editor);
      if (!placed) {
        range.selectNodeContents(editor);
        range.collapse(false);
      }

      selection.removeAllRanges();
      selection.addRange(range);
    }, []);

    const saveCaretPosition = useCallback(() => {
      if (document.activeElement !== editorRef.current) return;
      const offset = computeSelectionOffset();
      if (offset !== null) caretOffsetRef.current = offset;
    }, [computeSelectionOffset]);

    // =========================
    // ACTIONS
    // =========================

    const insertText = useCallback(
      (text: string) => {
        const editor = editorRef.current;
        if (!editor) return;

        const currentText = value;
        const baseOffset = caretOffsetRef.current ?? currentText.length;
        const safeOffset = Math.max(
          0,
          Math.min(baseOffset, currentText.length),
        );

        const nextText =
          currentText.slice(0, safeOffset) +
          text +
          currentText.slice(safeOffset);
        const nextOffset = safeOffset + text.length;

        caretOffsetRef.current = nextOffset;
        onChange(nextText);

        // Re-focus and restore caret
        setTimeout(() => {
          editor.focus();
          restoreCaretFromOffset(nextOffset);
        }, 0);
      },
      [value, onChange, restoreCaretFromOffset],
    );

    useImperativeHandle(ref, () => ({
      focus: () => editorRef.current?.focus(),
      insertTextAtCaret: insertText,
    }));

    // Sync HTML khi value từ ngoài thay đổi (ví dụ: reset form hoặc xóa tin nhắn)
    useEffect(() => {
      const currentHtmlText = convertEmojiImageMarkupToText(htmlRef.current);
      if (value !== currentHtmlText) {
        htmlRef.current = convertEmojiTextToImageMarkup(value, EMOJI_SIZE);
        if (editorRef.current) {
          // Tránh cập nhật innerHTML nếu không thực sự thay đổi để không mất caret
          const newHtml = htmlRef.current;
          if (editorRef.current.innerHTML !== newHtml) {
            editorRef.current.innerHTML = newHtml;
          }
        }
      }
    }, [value]);

    // =========================
    // HANDLERS
    // =========================

    const handleChange = (event: ContentEditableEvent) => {
      const html = event.target.value;
      htmlRef.current = html;

      // Cập nhật caret ngay lập tức khi gõ
      const offset = computeSelectionOffset();
      if (offset !== null) caretOffsetRef.current = offset;

      const plainText = convertEmojiImageMarkupToText(html);
      // contentEditable may keep one non-breaking space after deleting the last emoji.
      onChange(plainText === " " ? "" : plainText);
    };

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      if (text) insertText(text);
    };

    return (
      <div className="relative flex-1 w-full resize-none overflow-hidden">
        {/* Placeholder */}
        {!value && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-sm text-gray-400 select-none">
            {placeholder}
          </div>
        )}

        <ContentEditable
          innerRef={(el: HTMLElement | null) => (editorRef.current = el)}
          html={htmlRef.current}
          disabled={disabled}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onKeyUp={saveCaretPosition}
          onMouseUp={saveCaretPosition}
          className="w-full bg-transparent outline-none text-sm leading-5 py-1.5 px-0 max-h-35 overflow-y-auto whitespace-pre-wrap wrap-break-word
  [&_img]:inline-block [&_img]:w-[1.6em] [&_img]:h-[1.4em] [&_img]:vertical-align-baseline [&_img]:relative [&_img]:top-[0.12em] [&_img]:pe-[0.4em]"
        />
      </div>
    );
  },
);

TextInput.displayName = "TextInput";
