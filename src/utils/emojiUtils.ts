/**
 * Emoji shortcode mapping
 * Hỗ trợ nhiều shortcode cho cùng 1 emoji
 */
export const EMOJI_MAP: Record<string, string> = {
  // Hearts
  "<3": "❤️",
  ":heart:": "❤️",
  ":love:": "❤️",
  ":broken_heart:": "💔",
  ":heartbreak:": "💔",
  ":orange_heart:": "🧡",
  ":yellow_heart:": "💛",
  ":green_heart:": "💚",
  ":blue_heart:": "💙",
  ":purple_heart:": "💜",
  ":black_heart:": "🖤",
  ":white_heart:": "🤍",

  // Happy faces
  ":)": "🙂",
  ":-)": "🙂",
  ":smile:": "😊",
  ":happy:": "😊",
  ":D": "😃",
  ":-D": "😃",
  ":grin:": "😁",
  ":laughing:": "😆",
  ":lol:": "😂",
  ":rofl:": "🤣",
  ":joy:": "😂",
  ":haha:": "😂",

  // Love faces
  ":kissing:": "😘",
  ":kiss:": "😘",
  ":blush:": "😊",
  ":heart_eyes:": "😍",
  ":in_love:": "😍",
  ":star_struck:": "🤩",

  // Sad faces
  ":(": "🙁",
  ":-(": "🙁",
  ":sad:": "😢",
  ":cry:": "😭",
  ":crying:": "😭",
  ":sob:": "😭",
  ":disappointed:": "😞",

  // Surprised/Shocked
  ":o": "😮",
  ":O": "😮",
  ":-o": "😮",
  ":-O": "😮",
  ":surprised:": "😲",
  ":shocked:": "😱",
  ":scream:": "😱",

  // Cool/Sunglasses
  "B-)": "😎",
  "8-)": "😎",
  ":cool:": "😎",
  ":sunglasses:": "😎",

  // Wink
  ";)": "😉",
  ";-)": "😉",
  ":wink:": "😉",

  // Angry
  ">:(": "😠",
  ">:-(": "😠",
  ":angry:": "😡",
  ":rage:": "😡",
  ":mad:": "😠",

  // Tongue/Silly
  ":p": "😛",
  ":P": "😛",
  ":-p": "😛",
  ":-P": "😛",
  ":tongue:": "😛",
  ":stuck_out_tongue:": "😛",
  ":crazy:": "🤪",

  // Thinking
  ":thinking:": "🤔",
  ":think:": "🤔",
  ":/": "😕",
  ":-/": "😕",
  ":confused:": "😕",

  // Neutral/Skeptical
  ":|": "😐",
  ":-|": "😐",
  ":neutral:": "😐",
  ":expressionless:": "😐",
  ":roll_eyes:": "🙄",

  // Sleepy/Tired
  ":sleepy:": "😪",
  ":tired:": "😫",
  ":yawn:": "🥱",
  ":sleeping:": "😴",

  // Sick
  ":sick:": "🤢",
  ":vomit:": "🤮",
  ":mask:": "😷",
  ":fever:": "🤒",

  // Party/Celebration
  ":party:": "🥳",
  ":celebrate:": "🥳",
  ":cowboy:": "🤠",
  ":nerd:": "🤓",

  // Gestures
  ":thumbsup:": "👍",
  ":+1:": "👍",
  ":thumbsdown:": "👎",
  ":-1:": "👎",
  ":clap:": "👏",
  ":applause:": "👏",
  ":pray:": "🙏",
  ":thanks:": "🙏",
  ":handshake:": "🤝",
  ":deal:": "🤝",
  ":raised_hands:": "🙌",
  ":celebration:": "🙌",

  // Symbols
  ":fire:": "🔥",
  ":star:": "⭐",
  ":sparkles:": "✨",
  ":100:": "💯",
  ":check:": "✅",
  ":x:": "❌",
  ":cross:": "❌",
};

/**
 * Danh sách emoji để hiển thị trong picker
 * Mỗi item có: emoji, shortcode chính, label
 */
export interface EmojiItem {
  emoji: string;
  shortcode: string;
  label: string;
  category?: string;
}

export const EMOJI_PICKER_LIST: EmojiItem[] = [
  // Smileys & Emotion
  {
    emoji: "😀",
    shortcode: ":grinning:",
    label: "Grinning Face",
    category: "smileys",
  },
  {
    emoji: "😃",
    shortcode: ":D",
    label: "Grinning Face with Big Eyes",
    category: "smileys",
  },
  {
    emoji: "😄",
    shortcode: ":smile:",
    label: "Grinning Face with Smiling Eyes",
    category: "smileys",
  },
  {
    emoji: "😁",
    shortcode: ":grin:",
    label: "Beaming Face",
    category: "smileys",
  },
  {
    emoji: "😆",
    shortcode: ":laughing:",
    label: "Laughing",
    category: "smileys",
  },
  {
    emoji: "😅",
    shortcode: ":sweat_smile:",
    label: "Sweat Smile",
    category: "smileys",
  },
  {
    emoji: "🤣",
    shortcode: ":rofl:",
    label: "Rolling on Floor Laughing",
    category: "smileys",
  },
  { emoji: "😂", shortcode: ":lol:", label: "Joy", category: "smileys" },
  {
    emoji: "🙂",
    shortcode: ":)",
    label: "Slightly Smiling",
    category: "smileys",
  },
  { emoji: "😉", shortcode: ";)", label: "Wink", category: "smileys" },
  { emoji: "😊", shortcode: ":blush:", label: "Blush", category: "smileys" },
  {
    emoji: "😇",
    shortcode: ":innocent:",
    label: "Innocent",
    category: "smileys",
  },
  {
    emoji: "🥰",
    shortcode: ":smiling_hearts:",
    label: "Smiling with Hearts",
    category: "smileys",
  },
  {
    emoji: "😍",
    shortcode: ":heart_eyes:",
    label: "Heart Eyes",
    category: "smileys",
  },
  {
    emoji: "🤩",
    shortcode: ":star_struck:",
    label: "Star Struck",
    category: "smileys",
  },
  {
    emoji: "😘",
    shortcode: ":kissing:",
    label: "Kissing",
    category: "smileys",
  },
  { emoji: "😋", shortcode: ":yum:", label: "Yum", category: "smileys" },
  { emoji: "😛", shortcode: ":p:", label: "Tongue", category: "smileys" },
  { emoji: "🤪", shortcode: ":crazy:", label: "Crazy", category: "smileys" },
  {
    emoji: "🤔",
    shortcode: ":thinking:",
    label: "Thinking",
    category: "smileys",
  },
  { emoji: "😐", shortcode: ":|", label: "Neutral", category: "smileys" },
  { emoji: "😕", shortcode: ":/", label: "Confused", category: "smileys" },
  {
    emoji: "🙄",
    shortcode: ":roll_eyes:",
    label: "Roll Eyes",
    category: "smileys",
  },
  {
    emoji: "😬",
    shortcode: ":grimacing:",
    label: "Grimacing",
    category: "smileys",
  },
  {
    emoji: "😴",
    shortcode: ":sleeping:",
    label: "Sleeping",
    category: "smileys",
  },
  { emoji: "😷", shortcode: ":mask:", label: "Mask", category: "smileys" },
  { emoji: "🤒", shortcode: ":fever:", label: "Fever", category: "smileys" },
  { emoji: "🤢", shortcode: ":sick:", label: "Sick", category: "smileys" },
  { emoji: "😎", shortcode: ":cool:", label: "Cool", category: "smileys" },
  { emoji: "🤓", shortcode: ":nerd:", label: "Nerd", category: "smileys" },
  { emoji: "🥳", shortcode: ":party:", label: "Party", category: "smileys" },
  { emoji: "😕", shortcode: ":/", label: "Confused", category: "smileys" },
  { emoji: "🙁", shortcode: ":(", label: "Sad", category: "smileys" },
  { emoji: "😢", shortcode: ":sad:", label: "Crying", category: "smileys" },
  { emoji: "😭", shortcode: ":cry:", label: "Sobbing", category: "smileys" },
  { emoji: "😱", shortcode: ":scream:", label: "Scream", category: "smileys" },
  { emoji: "😠", shortcode: ">:(", label: "Angry", category: "smileys" },
  { emoji: "😡", shortcode: ":rage:", label: "Rage", category: "smileys" },

  // Gestures
  { emoji: "👍", shortcode: ":+1:", label: "Thumbs Up", category: "gestures" },
  {
    emoji: "👎",
    shortcode: ":-1:",
    label: "Thumbs Down",
    category: "gestures",
  },
  { emoji: "👏", shortcode: ":clap:", label: "Clap", category: "gestures" },
  {
    emoji: "🙌",
    shortcode: ":raised_hands:",
    label: "Raised Hands",
    category: "gestures",
  },
  {
    emoji: "🤝",
    shortcode: ":handshake:",
    label: "Handshake",
    category: "gestures",
  },
  { emoji: "🙏", shortcode: ":pray:", label: "Pray", category: "gestures" },

  // Hearts
  { emoji: "❤️", shortcode: "<3", label: "Red Heart", category: "hearts" },
  {
    emoji: "🧡",
    shortcode: ":orange_heart:",
    label: "Orange Heart",
    category: "hearts",
  },
  {
    emoji: "💛",
    shortcode: ":yellow_heart:",
    label: "Yellow Heart",
    category: "hearts",
  },
  {
    emoji: "💚",
    shortcode: ":green_heart:",
    label: "Green Heart",
    category: "hearts",
  },
  {
    emoji: "💙",
    shortcode: ":blue_heart:",
    label: "Blue Heart",
    category: "hearts",
  },
  {
    emoji: "💜",
    shortcode: ":purple_heart:",
    label: "Purple Heart",
    category: "hearts",
  },
  {
    emoji: "🖤",
    shortcode: ":black_heart:",
    label: "Black Heart",
    category: "hearts",
  },
  {
    emoji: "🤍",
    shortcode: ":white_heart:",
    label: "White Heart",
    category: "hearts",
  },
  {
    emoji: "💔",
    shortcode: ":broken_heart:",
    label: "Broken Heart",
    category: "hearts",
  },

  // Symbols
  { emoji: "🔥", shortcode: ":fire:", label: "Fire", category: "symbols" },
  { emoji: "⭐", shortcode: ":star:", label: "Star", category: "symbols" },
  {
    emoji: "✨",
    shortcode: ":sparkles:",
    label: "Sparkles",
    category: "symbols",
  },
  { emoji: "💫", shortcode: ":dizzy:", label: "Dizzy", category: "symbols" },
  {
    emoji: "🌟",
    shortcode: ":glowing_star:",
    label: "Glowing Star",
    category: "symbols",
  },
  {
    emoji: "💯",
    shortcode: ":100:",
    label: "Hundred Points",
    category: "symbols",
  },
  {
    emoji: "✅",
    shortcode: ":check:",
    label: "Check Mark",
    category: "symbols",
  },
  { emoji: "❌", shortcode: ":x:", label: "Cross Mark", category: "symbols" },
];

/**
 * Convert text có chứa shortcode thành emoji
 * Ví dụ: "Hello <3" -> "Hello ❤️"
 */
export const convertShortcodeToEmoji = (text: string): string => {
  // Kiểm tra input hợp lệ
  if (!text || typeof text !== "string") {
    return String(text || "");
  }

  let result = text;

  // Decode HTML entities nếu có (ví dụ: &lt;3 -> <3)
  const textarea = document.createElement("textarea");
  textarea.innerHTML = result;
  result = textarea.value;

  // Sort by length để match longest first (tránh conflict)
  const sortedShortcodes = Object.keys(EMOJI_MAP).sort(
    (a, b) => b.length - a.length,
  );

  for (const shortcode of sortedShortcodes) {
    // Kiểm tra nếu text có chứa shortcode
    if (result.includes(shortcode)) {
      // Replace tất cả instance của shortcode
      result = result.split(shortcode).join(EMOJI_MAP[shortcode]);
    }
  }

  return result;
};

/**
 * Convert emoji thành shortcode (để lưu vào DB)
 * Ví dụ: "Hello ❤️" -> "Hello <3"
 */
export const convertEmojiToShortcode = (text: string): string => {
  let result = text;

  // Tạo reverse map (emoji -> shortcode)
  const reverseMap: Record<string, string> = {};
  for (const [shortcode, emoji] of Object.entries(EMOJI_MAP)) {
    // Ưu tiên shortcode ngắn hơn
    if (!reverseMap[emoji] || shortcode.length < reverseMap[emoji].length) {
      reverseMap[emoji] = shortcode;
    }
  }

  for (const [emoji, shortcode] of Object.entries(reverseMap)) {
    result = result.replaceAll(emoji, shortcode);
  }

  return result;
};

/**
 * Check xem text có chứa emoji/shortcode không
 */
export const containsEmoji = (text: string): boolean => {
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  return (
    emojiRegex.test(text) ||
    Object.keys(EMOJI_MAP).some((shortcode) => text.includes(shortcode))
  );
};
