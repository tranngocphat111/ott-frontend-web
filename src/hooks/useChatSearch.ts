import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageService } from "../services";
import {
  getConversationDisplayAvatar,
  getConversationDisplayName,
} from "../utils";
import type {
  ConversationWithParticipant,
  SearchEverythingResponse,
  SearchTab,
} from "../types";

interface UseChatSearchParams {
  conversations: ConversationWithParticipant[];
  normalizedUserId?: string;
  onConversationSelect?: (conversation: ConversationWithParticipant) => void;
}

const EMPTY_SEARCH: SearchEverythingResponse = {
  contacts: [],
  conversations: [],
  messages: [],
  files: [],
  media: [],
  total: 0,
};

const useChatSearch = ({
  conversations,
  normalizedUserId,
  onConversationSelect,
}: UseChatSearchParams) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] =
    useState<SearchEverythingResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTab, setSearchTab] = useState<SearchTab>("all");
  const [messageSenderFilter, setMessageSenderFilter] = useState("");
  const [isSenderDropdownOpen, setIsSenderDropdownOpen] = useState(false);
  const [senderSearchText, setSenderSearchText] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistoryConversationIds, setSearchHistoryConversationIds] =
    useState<string[]>([]);
  const senderDropdownRef = useRef<HTMLDivElement>(null);

  const searchHistoryKey = `chat_search_history_${normalizedUserId || "guest"}`;
  const keyword = searchTerm.trim();
  const isSearchPanelOpen = isSearchFocused || keyword.length > 0;

  useEffect(() => {
    if (!keyword || !normalizedUserId) {
      setSearchResults(null);
      setIsSearching(false);
      setMessageSenderFilter("");
      setIsSenderDropdownOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const data = await MessageService.searchEverything(normalizedUserId, keyword, {
          limit: 24,
        });
        setSearchResults(data);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults(EMPTY_SEARCH);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [keyword, normalizedUserId]);

  useEffect(() => {
    if (!normalizedUserId) return;

    try {
      const raw = localStorage.getItem(searchHistoryKey);
      if (!raw) {
        setSearchHistoryConversationIds([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setSearchHistoryConversationIds([]);
        return;
      }

      const valid = parsed
        .map((id) => String(id))
        .filter((id) => conversations.some((item) => item.conversation._id === id));
      setSearchHistoryConversationIds(valid);
    } catch {
      setSearchHistoryConversationIds([]);
    }
  }, [normalizedUserId, searchHistoryKey, conversations]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (
        senderDropdownRef.current &&
        !senderDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSenderDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (searchTab !== "messages") {
      setIsSenderDropdownOpen(false);
      setSenderSearchText("");
    }
  }, [searchTab]);

  const openConversationTarget = useCallback(
    (conversationId: string, messageId?: string) => {
      const matched = conversations.find(
        (item) => item.conversation._id === conversationId,
      );

      if (!matched) return;

      const nextHistory = [
        conversationId,
        ...searchHistoryConversationIds.filter((id) => id !== conversationId),
      ].slice(0, 20);
      setSearchHistoryConversationIds(nextHistory);
      try {
        localStorage.setItem(searchHistoryKey, JSON.stringify(nextHistory));
      } catch {
        // ignore localStorage write failures
      }

      onConversationSelect?.(matched);

      if (!messageId) return;

      const payload = { conversationId, messageId, at: Date.now() };
      sessionStorage.setItem("chat_jump_target", JSON.stringify(payload));

      const dispatch = () => {
        window.dispatchEvent(
          new CustomEvent("chat:jump", {
            detail: { conversationId, messageId },
          }),
        );
      };

      dispatch();
      setTimeout(dispatch, 450);
    },
    [
      conversations,
      onConversationSelect,
      searchHistoryConversationIds,
      searchHistoryKey,
    ],
  );

  const conversationMetaMap = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string }>();
    conversations.forEach((item) => {
      map.set(item.conversation._id, {
        name:
          getConversationDisplayName(item.conversation, normalizedUserId) ||
          item.conversation.name ||
          "Đoạn chat",
        avatar:
          getConversationDisplayAvatar(item.conversation, normalizedUserId) ||
          "",
      });
    });
    return map;
  }, [conversations, normalizedUserId]);

  const highlightKeyword = useCallback(
    (text: string) => {
      const rawText = String(text || "");
      if (!keyword) return rawText;

      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "ig");
      const parts = rawText.split(regex);

      return parts.map((part, index) => {
        if (part.toLowerCase() === keyword.toLowerCase()) {
          return React.createElement(
            "strong",
            { key: `${part}-${index}`, className: "font-bold text-primary-800" },
            part,
          );
        }
        return React.createElement(React.Fragment, { key: `${part}-${index}` }, part);
      });
    },
    [keyword],
  );

  const historyConversations = useMemo(() => {
    return searchHistoryConversationIds
      .map((conversationId) => {
        const matched = conversations.find(
          (item) => item.conversation._id === conversationId,
        );
        return matched || null;
      })
      .filter((item): item is ConversationWithParticipant => !!item);
  }, [searchHistoryConversationIds, conversations]);

  const persistSearchHistory = useCallback(
    (nextHistory: string[]) => {
      setSearchHistoryConversationIds(nextHistory);
      try {
        localStorage.setItem(searchHistoryKey, JSON.stringify(nextHistory));
      } catch {
        // ignore localStorage write failures
      }
    },
    [searchHistoryKey],
  );

  const handleRemoveHistoryItem = useCallback(
    (conversationId: string) => {
      const nextHistory = searchHistoryConversationIds.filter(
        (id) => id !== conversationId,
      );
      persistSearchHistory(nextHistory);
    },
    [searchHistoryConversationIds, persistSearchHistory],
  );

  const handleClearAllHistory = useCallback(() => {
    persistSearchHistory([]);
  }, [persistSearchHistory]);

  const filteredSearchMessages = useMemo(() => {
    if (!searchResults) return [];
    if (!messageSenderFilter) return searchResults.messages;
    return searchResults.messages.filter(
      (item) => item.sender_id === messageSenderFilter,
    );
  }, [searchResults, messageSenderFilter]);

  const conversationResultsByName = useMemo(() => {
    if (!searchResults) return [];

    const normalizedKeyword = keyword.toLowerCase();
    if (!normalizedKeyword) return searchResults.conversations;

    return searchResults.conversations.filter((conv) =>
      String(conv.name || "")
        .toLowerCase()
        .includes(normalizedKeyword),
    );
  }, [searchResults, keyword]);

  const senderOptions = useMemo(() => {
    if (!searchResults) return [];
    const map = new Map<string, string>();
    searchResults.messages.forEach((msg) => {
      if (!msg.sender_id) return;
      if (!map.has(msg.sender_id)) {
        map.set(msg.sender_id, msg.sender_name || msg.sender_id);
      }
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [searchResults]);

  const filteredSenderOptions = useMemo(() => {
    const query = senderSearchText.trim().toLowerCase();
    if (!query) return senderOptions;
    return senderOptions.filter((sender) =>
      sender.name.toLowerCase().includes(query),
    );
  }, [senderOptions, senderSearchText]);

  const selectedSenderName =
    senderOptions.find((sender) => sender.id === messageSenderFilter)?.name ||
    "Tất cả người gửi";

  return {
    searchTerm,
    setSearchTerm,
    keyword,
    isSearchPanelOpen,
    setIsSearchFocused,
    searchResults,
    setSearchResults,
    isSearching,
    searchTab,
    setSearchTab,
    setMessageSenderFilter,
    isSenderDropdownOpen,
    setIsSenderDropdownOpen,
    senderSearchText,
    setSenderSearchText,
    senderDropdownRef,
    openConversationTarget,
    conversationMetaMap,
    highlightKeyword,
    historyConversations,
    handleRemoveHistoryItem,
    handleClearAllHistory,
    filteredSearchMessages,
    conversationResultsByName,
    senderOptions,
    filteredSenderOptions,
    selectedSenderName,
  };
};

export default useChatSearch;
