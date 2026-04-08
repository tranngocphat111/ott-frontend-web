import type { Message } from "../../../types";
import { MessageLayout } from "./MessageLayout";

export const ImageMessage = ({
  msg,
  urls,
  isMe,
  currentUserId,
  isFirstInSequence,
  isLastInSequence,
  isTopBoundary,
  onClick,
  onReply,
  onReact,
  onRevoke,
  onDelete,
  onPin,
}: {
  msg: Message;
  urls: string[];
  isMe: boolean;
  currentUserId?: string;
  isFirstInSequence: boolean;
  isLastInSequence: boolean;
  isTopBoundary?: boolean;
  onClick?: (imageIndex: number) => void;
  onReply?: (msg: Message) => void;
  onReact?: (msg: Message, reactionType: string) => void;
  onRevoke?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onPin?: (msg: Message) => void;
}) => {
  const count = urls.length;

  const imgCell = (url: string, index: number, className = "") => (
    <div
      key={index}
      className={`overflow-hidden cursor-pointer hover:brightness-90 transition-all ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(index);
      }}
    >
      <img
        src={url}
        alt="Attachment"
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );

  const renderGrid = (borderRadius: string) => {
    // 1 ảnh
    if (count === 1) {
      return (
        <div
          className={`overflow-hidden cursor-pointer border border-gray-200 shadow-sm hover:brightness-90 transition-all ${borderRadius}`}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(0);
          }}
        >
          <img
            src={urls[0]}
            alt="Attachment"
            className="block max-w-full h-auto object-cover max-h-100 min-w-25"
            loading="eager"
          />
        </div>
      );
    }

    // 2 ảnh
    if (count === 2) {
      return (
        <div
          className={`grid grid-cols-2 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
          style={{ width: "300px" }}
        >
          {urls.map((url, i) => (
            <div
              key={i}
              className="overflow-hidden cursor-pointer hover:brightness-90 transition-all"
              style={{ height: "150px" }}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(i);
              }}
            >
              <img
                src={url}
                alt="Attachment"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          ))}
        </div>
      );
    }

    // 3 ảnh: 1 lớn bên trái + 2 nhỏ bên phải
    if (count === 3) {
      return (
        <div
          className={`grid grid-cols-2 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
          style={{ width: "300px", gridTemplateRows: "repeat(2, 150px)" }}
        >
          {/* ảnh đầu chiếm cả cột trái */}
          <div
            className="row-span-2 overflow-hidden cursor-pointer hover:brightness-90 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(0);
            }}
          >
            <img
              src={urls[0]}
              alt="Attachment"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
          {/* 2 ảnh còn lại xếp dọc bên phải */}
          {urls.slice(1, 3).map((url, i) => imgCell(url, i + 1, ""))}
        </div>
      );
    }

    // 4 ảnh: 2x2 grid
    if (count === 4) {
      return (
        <div
          className={`grid grid-cols-2 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
          style={{ width: "300px" }}
        >
          {urls.map((url, i) => (
            <div
              key={i}
              className="overflow-hidden cursor-pointer hover:brightness-90 transition-all"
              style={{ height: "150px" }}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(i);
              }}
            >
              <img
                src={url}
                alt="Attachment"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          ))}
        </div>
      );
    }

    // 5+ ảnh: grid 3 cột, hiển thị tối đa 6 ô, ô cuối overlay "+N"
    const visibleUrls = urls.slice(0, 6);
    const remaining = count - 6;

    return (
      <div
        className={`grid grid-cols-3 gap-0.5 overflow-hidden border border-gray-200 shadow-sm ${borderRadius}`}
        style={{ width: "300px" }}
      >
        {visibleUrls.map((url, i) => (
          <div
            key={i}
            className="relative overflow-hidden cursor-pointer hover:brightness-90 transition-all"
            style={{ height: "100px" }}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(i);
            }}
          >
            <img
              src={url}
              alt="Attachment"
              className="w-full h-full object-cover"
              loading="eager"
            />
            {i === 5 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-xl font-bold pointer-events-none">
                +{remaining}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <MessageLayout
      msg={msg}
      isMe={isMe}
      currentUserId={currentUserId}
      isFirst={isFirstInSequence}
      isLast={isLastInSequence}
      isTopBoundary={isTopBoundary}
      onReply={onReply}
      onReact={onReact}
      onRevoke={onRevoke}
      onDelete={onDelete}
      onPin={onPin}
    >
      {(borderRadius) => renderGrid(borderRadius)}
    </MessageLayout>
  );
};
