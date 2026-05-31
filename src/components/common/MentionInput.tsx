import React, { useState, useCallback, useRef, useEffect } from "react";
import { MentionsInput, Mention } from "react-mentions";
import { UserService } from "../../services/user.service";
import type { User } from "../../types";
import UserAvatar from "../social/UserAvatar";
import "./MentionInput.css";

interface MentionInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  multiline?: boolean;
  dropdownPosition?: "top" | "bottom";
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onValueChange,
  className,
  multiline = true,
  dropdownPosition = "top",
  placeholder,
  autoFocus,
  rows,
  ...props
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (event: { target: { value: string } }, newValue: string, newPlainTextValue: string) => {
    // MentionsInput calls onChange with an event-like object
    // newValue is the markup text e.g. "Hello @[User](123)"
    // newPlainTextValue is the plain text e.g. "Hello @User"

    if (onValueChange) {
      onValueChange(newValue);
    }

    if (onChange) {
      // Mock an event object for compatibility with external onChange
      const syntheticEvent = {
        target: { value: newValue },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
    }
  };

  const fetchUsers = useCallback(async (query: string, callback: (data: any[]) => void) => {
    if (!query) {
      callback([]);
      return;
    }
    try {
      const results = await UserService.searchUsers(query);
      const formattedResults = results.slice(0, 10).map((user) => ({
        id: user.user_id || user._id,
        display: user.name || user.display_name || user.username || "User",
        user: user,
      }));
      callback(formattedResults);
    } catch (error) {
      console.error(error);
      callback([]);
    }
  }, []);

  const renderSuggestion = (
    suggestion: any,
    search: string,
    highlightedDisplay: React.ReactNode,
    index: number,
    focused: boolean
  ) => {
    const user: User = suggestion.user;
    return (
      <div
        className={`flex items-center gap-2 p-2 cursor-pointer ${
          focused ? "bg-primary-50" : "hover:bg-gray-50"
        }`}
      >
        <div className="size-8 rounded-full overflow-hidden shrink-0">
          <UserAvatar
            user={{
              id: user.user_id || user._id,
              displayName: user.name || "",
              avatar: user.avatar || "",
            }}
            size="size-8"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {highlightedDisplay}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative w-full ${className || ""}`}>
      <MentionsInput
        inputRef={inputRef as any}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`mentions-input ${!multiline ? "mentions-input--single" : ""}`}
        style={{ width: "100%" }}
        allowSpaceInQuery
        singleLine={!multiline}
        allowSuggestionsAboveCursor={true}
        suggestionsPortalHost={typeof document !== "undefined" ? document.body : undefined}
      >
        <Mention
          trigger="@"
          data={fetchUsers}
          displayTransform={(id, display) => `@[${display}]`}
          markup="@[__display__](__id__)"
          renderSuggestion={renderSuggestion}
          appendSpaceOnAdd
          className="mentions-mention"
        />
      </MentionsInput>
    </div>
  );
};

export default MentionInput;
