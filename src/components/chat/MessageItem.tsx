export const MessageItem = ({ msg, isMe }: { msg: any; isMe: boolean }) => (
  <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
    <div
      className={`px-5 py-3 max-w-[70%] text-[15px] leading-relaxed shadow-sm break-words
        ${
          isMe
            ? "bg-[#EFDCCB] text-gray-900 rounded-2xl rounded-tr-sm"
            : "bg-white text-gray-900 rounded-2xl rounded-tl-sm border border-gray-100"
        }`}
    >
      {msg.content}
    </div>
  </div>
);
