import React from "react";
import { REACTIONS, type ReactionKey } from "./reactions";

const fmtCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

interface Props {
  reactionCounts: Record<ReactionKey, number>;
  commentCount: number;
  shares: number;
  onToggleComments: () => void;
}

const PostReactionsSummary: React.FC<Props> = ({
  reactionCounts,
  commentCount,
  shares,
  onToggleComments,
}) => {
  const topReactions = REACTIONS.filter((r) => reactionCounts[r.key] > 0).sort(
    (a, b) => reactionCounts[b.key] - reactionCounts[a.key],
  );
  const totalReactions = Object.values(reactionCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  if (totalReactions === 0 && commentCount === 0 && shares === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 flex items-center justify-between text-primary-400 text-sm border-t border-primary-100">
      <div className="flex items-center gap-1.5">
        {topReactions.length > 0 && (
          <>
            <div className="flex -space-x-1">
              {topReactions.slice(0, 3).map((r) => (
                <span
                  key={r.key}
                  className="size-4.5 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[11px] shadow-sm"
                  title={`${r.label}: ${reactionCounts[r.key]}`}>
                  {r.emoji}
                </span>
              ))}
            </div>
            <span>{fmtCount(totalReactions)}</span>
          </>
        )}
      </div>
      <div className="flex gap-3 text-xs">
        <button
          onClick={onToggleComments}
          className="hover:underline cursor-pointer">
          {commentCount} bình luận
        </button>
        <span className="hover:underline cursor-pointer">
          {shares} lượt chia sẻ
        </span>
      </div>
    </div>
  );
};

export default PostReactionsSummary;
