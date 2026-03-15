export const getAvatarColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

export const getAvatarLabel = (str: string) => {
  return str ? str.charAt(0).toUpperCase() : "?";
};

export const getMessageBorderRadius = (
  isMe: boolean,
  isFirst: boolean,
  isLast: boolean,
) => {
  if (isMe) {
    if (isFirst && isLast) return "rounded-[18px]";
    if (isFirst) return "rounded-[18px] rounded-br-[2px]";
    if (isLast) return "rounded-[18px] rounded-tr-[2px]";
    return "rounded-[18px] rounded-r-[2px]";
  } else {
    if (isFirst && isLast) return "rounded-[18px]";
    if (isFirst) return "rounded-[18px] rounded-bl-[2px]";
    if (isLast) return "rounded-[18px] rounded-tl-[2px]";
    return "rounded-[18px] rounded-l-[2px]";
  }
};
