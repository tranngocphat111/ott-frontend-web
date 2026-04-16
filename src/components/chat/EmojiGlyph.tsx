import { useState } from "react";
import {
  APPLE_EMOJI_FONT_FAMILY,
  getEmojiImageUrl,
} from "../../constants/emoji.constants";

interface EmojiGlyphProps {
  emoji: string;
  size?: number;
  className?: string;
}

export const EmojiGlyph = ({
  emoji,
  size = 20,
  className = "",
}: EmojiGlyphProps) => {
  const [failed, setFailed] = useState(false);

  const boxStyle = {
    width: `${size}px`,
    height: `${size}px`,
  } as const;

  if (failed) {
    return (
      <span
        className={className}
        style={{
          ...boxStyle,
          fontFamily: APPLE_EMOJI_FONT_FAMILY,
          fontSize: `${size}px`,
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {emoji}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{
        ...boxStyle,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={getEmojiImageUrl(emoji)}
        alt={emoji}
        loading="lazy"
        draggable={false}
        className="block w-full h-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
};
