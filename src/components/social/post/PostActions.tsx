import React from "react";
import { MessageCircle, Share2, ThumbsUp } from "lucide-react";
import ReactionPicker from "./ReactionPicker";
import type { ReactionKey } from "./reactions";

interface Props {
  reaction: ReactionKey | null;
  reactionLabel: string;
  reactionEmoji?: string;
  reactionColor: string;
  showComments: boolean;
  showPicker: boolean;
  onLikeClick: () => void;
  onToggleComments: () => void;
  onSelectReaction: (key: ReactionKey) => void;
  onLikeMouseEnter: () => void;
  onLikeMouseLeave: () => void;
  onPickerMouseEnter: () => void;
  onPickerMouseLeave: () => void;
}

const PostActions: React.FC<Props> = ({
  reaction,
  reactionLabel,
  reactionEmoji,
  reactionColor,
  showComments,
  showPicker,
  onLikeClick,
  onToggleComments,
  onSelectReaction,
  onLikeMouseEnter,
  onLikeMouseLeave,
  onPickerMouseEnter,
  onPickerMouseLeave,
}) => (
  <div className="px-4 py-1 border-t border-primary-100 flex">
    <div
      className="flex-1 relative"
      onMouseEnter={onLikeMouseEnter}
      onMouseLeave={onLikeMouseLeave}>
      {showPicker && (
        <ReactionPicker
          reaction={reaction}
          onSelect={onSelectReaction}
          onMouseEnter={onPickerMouseEnter}
          onMouseLeave={onPickerMouseLeave}
        />
      )}

      <button
        onClick={onLikeClick}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-primary-50 transition font-medium text-sm ${reactionColor
          }`}>
        {reactionEmoji ?
          <span className="text-lg leading-none">{reactionEmoji}</span>
          : <ThumbsUp className="size-5" />}
        <span>{reactionLabel}</span>
      </button>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleComments();
      }}
      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-primary-50 transition font-medium text-sm ${showComments ? "text-primary-500" : "text-primary-700"
        }`}>
      <MessageCircle
        className={`size-5 ${showComments ? "fill-primary-100" : ""}`}
      />
      Bình luận
    </button>
    <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-primary-50 transition text-primary-700 font-medium text-sm">
      <Share2 className="size-5" />
      Chia sẻ
    </button>
  </div>
);

export default PostActions;
