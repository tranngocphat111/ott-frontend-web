import React from "react";
import { REACTIONS, type ReactionKey } from "./reactions";

interface Props {
  reaction: ReactionKey | null;
  onSelect: (key: ReactionKey) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ReactionPicker: React.FC<Props> = ({
  reaction,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}) => (
  <div
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl px-2 py-1.5 flex items-center gap-1 z-20"
    style={{ minWidth: "max-content" }}>
    {REACTIONS.map((r) => (
      <button
        key={r.key}
        onClick={() => onSelect(r.key)}
        title={r.label}
        className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl transition-transform hover:scale-125 hover:bg-gray-50 ${
          reaction === r.key ? "scale-125" : ""
        }`}>
        <span className="text-2xl leading-none">{r.emoji}</span>
        <span className={`text-[10px] font-medium ${r.color}`}>{r.label}</span>
      </button>
    ))}
  </div>
);

export default ReactionPicker;
