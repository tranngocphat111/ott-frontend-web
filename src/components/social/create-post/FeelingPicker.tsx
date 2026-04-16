import React from "react";
import { Smile } from "lucide-react";
import type { FeelingOption } from "./types";

interface FeelingPickerProps {
  feelingSearch: string;
  onFeelingSearchChange: (value: string) => void;
  feelings: FeelingOption[];
  feeling: FeelingOption | null;
  onSelectFeeling: (value: FeelingOption) => void;
}

const FeelingPicker: React.FC<FeelingPickerProps> = ({
  feelingSearch,
  onFeelingSearchChange,
  feelings,
  feeling,
  onSelectFeeling,
}) => {
  return (
    <div className="mx-4 mb-3 border border-yellow-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-yellow-100">
        <Smile className="size-4 text-yellow-500 shrink-0" />
        <input
          type="text"
          value={feelingSearch}
          onChange={(e) => onFeelingSearchChange(e.target.value)}
          placeholder="Tìm cảm xúc..."
          className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-4 gap-1 p-2 max-h-48 overflow-y-auto">
        {feelings.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelectFeeling(item)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-yellow-50 transition ${
              feeling?.label === item.label ?
                "bg-yellow-100 ring-1 ring-yellow-300"
              : ""
            }`}>
            <span className="text-xl">{item.emoji}</span>
            <span className="text-xs text-gray-600 leading-tight text-center">
              {item.label}
            </span>
          </button>
        ))}
        {feelings.length === 0 && (
          <p className="col-span-4 text-center text-sm text-gray-400 py-4">
            Không tìm thấy cảm xúc
          </p>
        )}
      </div>
    </div>
  );
};

export default FeelingPicker;
