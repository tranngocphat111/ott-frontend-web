import { useMemo, type JSX } from "react";
import { convertDisplayShortcodeToEmoji } from "../../constants/emoji.constants";
import { EmojiGlyph } from "./EmojiGlyph";

const EMOJI_CLUSTER_PATTERN = /\p{Extended_Pictographic}/u;

const splitByGrapheme = (value: string): string[] => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return Array.from(segmenter.segment(value), (segment) => segment.segment);
  }

  return Array.from(value);
};

interface EmojiTextProps {
  text: string;
  emojiSize?: number;
  emojiClassName?: string;
}

export const EmojiText = ({
  text,
  emojiSize = 18,
  emojiClassName = "inline-block align-[-0.2em]",
}: EmojiTextProps) => {
  const renderedText = useMemo(() => {
    const normalizedText = convertDisplayShortcodeToEmoji(text || "");
    const graphemes = splitByGrapheme(normalizedText);
    const nodes: Array<string | JSX.Element> = [];
    let textBuffer = "";

    const flushTextBuffer = () => {
      if (!textBuffer) {
        return;
      }

      nodes.push(textBuffer);
      textBuffer = "";
    };

    graphemes.forEach((segment, index) => {
      if (EMOJI_CLUSTER_PATTERN.test(segment)) {
        flushTextBuffer();
        nodes.push(
          <EmojiGlyph
            key={`emoji-${index}`}
            emoji={segment}
            size={emojiSize}
            className={emojiClassName}
          />,
        );
        return;
      }

      textBuffer += segment;
    });

    flushTextBuffer();
    return nodes;
  }, [text, emojiSize, emojiClassName]);

  return <>{renderedText}</>;
};
