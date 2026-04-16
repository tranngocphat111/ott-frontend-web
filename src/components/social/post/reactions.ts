export const REACTIONS = [
    { key: "like", emoji: "👍", label: "Thích", color: "text-blue-500" },
    { key: "love", emoji: "❤️", label: "Yêu thích", color: "text-red-500" },
    { key: "haha", emoji: "😂", label: "Hà hà", color: "text-yellow-500" },
    { key: "wow", emoji: "😮", label: "Wow", color: "text-yellow-500" },
    { key: "sad", emoji: "😢", label: "Buồn bả", color: "text-yellow-500" },
    { key: "angry", emoji: "😡", label: "Phẫn nộ", color: "text-orange-500" },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]["key"];

export const getReactionByKey = (key: ReactionKey | null) =>
    REACTIONS.find((reaction) => reaction.key === key) ?? null;
