import { useEffect, useRef } from "react";
import { EMOJI_PICKER_LIST } from "../../../utils/emojiUtils";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
      style={{ width: "360px", maxHeight: "320px" }}
    >
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-700">Chọn emoji</span>
        <button
          onClick={onClose}
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
            onClick={() => onSelect(item.emoji)}
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
  );
};
