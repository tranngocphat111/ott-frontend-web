import { useEffect, useMemo, useRef, useState } from "react";
import {
  Smile,
  Cat,
  Coffee,
  Activity,
  Map,
  Box,
  Hash,
  Flag,
  Heart,
  ThumbsUp,
  Sparkles,
} from "lucide-react";
import {
  EMOJI_CATEGORIES,
  EMOJI_LIST,
} from "../../../constants/emoji.constants";
import { EmojiGlyph } from "../EmojiGlyph";

/**
 * Cấu hình Icon cho từng danh mục
 * Sử dụng strokeWidth={2.5} để icon sắc nét, không bị mờ
 */
const getCategoryConfig = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  const commonProps = { size: 18, strokeWidth: 2.5 }; // Đồng bộ strokeWidth dày hơn

  if (
    name.includes("smiley") ||
    name.includes("face") ||
    name.includes("emotion")
  ) {
    return { labelVi: "Mặt cười & Cảm xúc", icon: <Smile {...commonProps} /> };
  }
  if (
    name.includes("gesture") ||
    name.includes("people") ||
    name.includes("body")
  ) {
    return { labelVi: "Cử chỉ & Người", icon: <ThumbsUp {...commonProps} /> };
  }
  if (name.includes("heart")) {
    return { labelVi: "Trái tim", icon: <Heart {...commonProps} /> };
  }
  if (name.includes("animal") || name.includes("nature")) {
    return {
      labelVi: "Động vật & Thiên nhiên",
      icon: <Cat {...commonProps} />,
    };
  }
  if (name.includes("food") || name.includes("drink")) {
    return { labelVi: "Đồ ăn & Thức uống", icon: <Coffee {...commonProps} /> };
  }
  if (name.includes("activit") || name.includes("sport")) {
    return { labelVi: "Hoạt động", icon: <Activity {...commonProps} /> };
  }
  if (name.includes("travel") || name.includes("place")) {
    return { labelVi: "Du lịch & Địa điểm", icon: <Map {...commonProps} /> };
  }
  if (name.includes("object")) {
    return { labelVi: "Đồ vật", icon: <Box {...commonProps} /> };
  }
  if (name.includes("symbol")) {
    return { labelVi: "Biểu tượng", icon: <Hash {...commonProps} /> };
  }
  if (name.includes("flag")) {
    return { labelVi: "Cờ", icon: <Flag {...commonProps} /> };
  }
  return { labelVi: categoryName, icon: <Sparkles {...commonProps} /> };
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // 1. Tạo ref cho container chứa danh sách emoji
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [activeCategory, setActiveCategory] = useState<string>(
    EMOJI_CATEGORIES[0] ?? "",
  );

  const filteredEmojis = useMemo(() => {
    return EMOJI_LIST.filter((item) => {
      return activeCategory ? item.category === activeCategory : true;
    });
  }, [activeCategory]);

  // 2. Effect để scroll lên đầu mỗi khi activeCategory thay đổi
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeCategory]);

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
      className="absolute bottom-full ms-2 mb-2 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150"
      style={{ width: "290px", maxHeight: "320px" }}
    >
      {/* Phần Categories Tabs (Giữ nguyên) */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pt-2 pb-1.5 px-2 shrink-0 scrollbar-hide border-b border-gray-100">
        {EMOJI_CATEGORIES.map((category) => {
          const config = getCategoryConfig(category);
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setActiveCategory(category)}
              title={config.labelVi}
              className={`
                shrink-0 flex items-center justify-center w-7 h-7 rounded-full 
                transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? "bg-primary-100 text-primary-600 scale-105"
                    : "bg-transparent text-slate-500 hover:bg-primary-50 hover:text-primary-300"
                }
              `}
            >
              {config.icon}
            </button>
          );
        })}
      </div>

      {/* 3. Gán scrollContainerRef vào phần lưới Emoji */}
      <div
        ref={scrollContainerRef}
        className="grid grid-cols-7 gap-y-0.5 gap-x-0 overflow-y-auto px-1.5 py-2 flex-1 custom-scrollbar"
        style={{ minHeight: "150px" }}
      >
        {filteredEmojis.map((item) => (
          <button
            key={`${item.category}-${item.shortcode}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(item.emoji)}
            className="w-9 h-9 mx-auto rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center active:scale-90"
          >
            <EmojiGlyph emoji={item.emoji} size={24} className="inline-block" />
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmojis.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-400 flex-1">
          Không tìm thấy emoji
        </div>
      )}
    </div>
  );
};
