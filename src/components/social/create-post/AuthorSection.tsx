import React from "react";
import { ChevronDown, X } from "lucide-react";
import type { FeelingOption, VisibilityOption } from "./types";

interface AuthorSectionProps {
  currentUser: {
    id: string;
    displayName: string;
    color: string;
    avatar?: string;
  };
  feeling: FeelingOption | null;
  onClearFeeling: () => void;
  visibility: string;
  showVisibility: boolean;
  onToggleVisibility: () => void;
  onSelectVisibility: (value: string) => void;
  visibilityOptions: VisibilityOption[];
}

const AuthorSection: React.FC<AuthorSectionProps> = ({
  currentUser,
  feeling,
  onClearFeeling,
  visibility,
  showVisibility,
  onToggleVisibility,
  onSelectVisibility,
  visibilityOptions,
}) => {
  const currentOpt =
    visibilityOptions.find((option) => option.value === visibility) ??
    visibilityOptions[0];
  const VisIcon = currentOpt.Icon;

  return (
    <div className="flex items-center gap-3 px-4 pt-3 pb-2">
      <div
        className={`size-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center ${
          !currentUser.avatar ? currentUser.color : ""
        }`}>
        {currentUser.avatar ?
          <img
            src={currentUser.avatar}
            alt=""
            className="size-full object-cover"
          />
        : <span className="text-white font-bold text-sm">
            {currentUser.displayName.split(" ").pop()?.charAt(0)}
          </span>
        }
      </div>
      <div>
        <div className="flex items-center gap-1 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm">
            {currentUser.displayName}
          </p>
          {feeling && (
            <span className=" text-center text-sm text-gray-600">
              đang cảm thấy {feeling.emoji}{" "}
              <span className="font-medium text-gray-700">{feeling.label}</span>
              <button
                onClick={onClearFeeling}
                className="ml-1 text-gray-400 hover:text-gray-600 transition align-middle">
                <X className="size-3 inline" />
              </button>
            </span>
          )}
        </div>
        <div className="relative">
          <button
            onClick={onToggleVisibility}
            className="flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-medium text-gray-700 transition">
            <VisIcon className="size-3" />
            <span>{currentOpt.label}</span>
            <ChevronDown className="size-3" />
          </button>
          {showVisibility && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-36 overflow-hidden">
              {visibilityOptions.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => onSelectVisibility(value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition ${
                    visibility === value ?
                      "text-primary-600 font-semibold"
                    : "text-gray-700"
                  }`}>
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorSection;
