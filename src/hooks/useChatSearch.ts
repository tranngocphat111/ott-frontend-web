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

type RawMessage = {
  _id?: string;
  msg_id?: string;
  conversation_id?: string;
  sender_id?: string;
  sender_name?: string;
  type?: string;
  content?: unknown;
  createdAt?: string;
  created_at?: string;
  is_deleted?: boolean;
  is_revoked?: boolean;
};

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
  const latestSearchRequestRef = useRef(0);

  const searchHistoryKey = `chat_search_history_${normalizedUserId || "guest"}`;
  const keyword = searchTerm.trim();
  const isSearchPanelOpen = isSearchFocused || keyword.length > 0;

  const normalizePreview = useCallback((message: RawMessage) => {
    const type = String(message.type || "text").toLowerCase();
    const content = Array.isArray(message.content)
      ? message.content
      : [message.content];
    const firstContent = content[0];
    const rawText =
      typeof firstContent === "string"
        ? firstContent
        : typeof firstContent === "object" && firstContent
          ? String(
              (firstContent as { text?: string; url?: string; name?: string })
                .text ||
                (firstContent as { text?: string; url?: string; name?: string })
                  .url ||
                (firstContent as { text?: string; url?: string; name?: string })
                  .name ||
                "",
            )
          : String(firstContent || "");

    if (type === "image") return "[Hình ảnh]";
    if (type === "video") return "[Video]";
    if (type === "file") return "[Tệp tin]";
    if (type === "audio") return "[Âm thanh]";

    return rawText.length > 160 ? `${rawText.slice(0, 160)}...` : rawText;
  }, []);

  const messageContainsKeyword = useCallback((message: RawMessage, q: string) => {
    const type = String(message.type || "").toLowerCase();
    const content = Array.isArray(message.content)
      ? message.content
      : [message.content];

    const text = content
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item) {
          const obj = item as { text?: string; url?: string; name?: string };
          return String(obj.text || obj.url || obj.name || "");
        }
        return String(item || "");
      })
      .join(" ")
      .toLowerCase();

    return (
      ["text", "link", "file", "image", "video", "audio"].includes(type) &&
      text.includes(q.toLowerCase())
    );
  }, []);

  const deepSearchMessages = useCallback(
    async (
      q: string,
      limit: number,
    ) => {
      if (!normalizedUserId || !q.trim()) return [];

      const conversationMetaById = new Map<
        string,
        { name: string; avatar: string; senderNameById: Record<string, string> }
      >();

      conversations.forEach((item) => {
        const senderNameById: Record<string, string> = {};

        (item.conversation.participants || []).forEach((participant) => {
          const participantId = String(
            participant.user_id || participant._id || "",
          ).trim();
          if (!participantId) return;

          const preferredName =
            String(participant.nickname || "").trim() ||
            String(participant.display_name || "").trim() ||
            String(participant.name || "").trim() ||
            participantId;

          senderNameById[participantId] = preferredName;
        });

        conversationMetaById.set(item.conversation._id, {
          name:
            getConversationDisplayName(item.conversation, normalizedUserId) ||
            item.conversation.name ||
            "Đoạn chat",
          avatar:
            getConversationDisplayAvatar(item.conversation, normalizedUserId) ||
            "",
          senderNameById,
        });
      });

      const results: SearchEverythingResponse["messages"] = [];
      const seenMessageIds = new Set<string>();

      const sortedConversations = [...conversations].sort((a, b) => {
        const timeA = new Date(
          a.conversation.updatedAt || a.conversation.createdAt || 0,
        ).getTime();
        const timeB = new Date(
          b.conversation.updatedAt || b.conversation.createdAt || 0,
        ).getTime();
        return timeB - timeA;
      });

      for (const item of sortedConversations) {
        if (results.length >= limit) break;

        const conversationId = item.conversation._id;
        let pageMessages: RawMessage[] = [];
        let hasMore = true;
        let pageCount = 0;
        const maxPagesPerConversation = 12;

        try {
          const firstBatch = await MessageService.getMessages(
            conversationId,
            normalizedUserId,
          );
          pageMessages = Array.isArray(firstBatch) ? firstBatch : [];
        } catch {
          pageMessages = [];
        }

        while (pageMessages.length > 0 && hasMore && pageCount < maxPagesPerConversation) {
          pageCount += 1;

          pageMessages.forEach((msg) => {
            if (results.length >= limit) return;
            if (msg?.is_deleted || msg?.is_revoked) return;
            if (!messageContainsKeyword(msg, q)) return;

            const messageId = String(msg.msg_id || msg._id || "");
            if (!messageId || seenMessageIds.has(messageId)) return;
            seenMessageIds.add(messageId);

            const senderId = String(msg.sender_id || "");
            const senderDisplayName =
              conversationMetaById.get(conversationId)?.senderNameById?.[senderId] ||
              msg.sender_name ||
              senderId;

            results.push({
              _id: String(msg._id || messageId),
              msg_id: messageId,
              conversation_id: conversationId,
              sender_id: senderId,
              sender_name: senderDisplayName,
              type: String(msg.type || "text"),
              preview: normalizePreview(msg),
              createdAt: msg.createdAt || msg.created_at,
            });
          });

          if (results.length >= limit) break;

          const oldest = pageMessages[0];
          const oldestMsgId = String(oldest?.msg_id || "");
          if (!oldestMsgId) break;

          try {
            const olderResponse = await MessageService.getOlderMessages(
              conversationId,
              oldestMsgId,
              50,
              normalizedUserId,
            );

            const olderMessages = Array.isArray(olderResponse?.messages)
              ? (olderResponse.messages as RawMessage[])
              : [];

            pageMessages = olderMessages;
            hasMore = Boolean(olderResponse?.hasMore && olderMessages.length > 0);
          } catch {
            hasMore = false;
            pageMessages = [];
          }
        }
      }

      return results
        .sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        })
        .slice(0, limit);
    },
    [conversations, messageContainsKeyword, normalizePreview, normalizedUserId],
  );

  useEffect(() => {
    if (!keyword || !normalizedUserId) {
      setSearchResults(null);
      setIsSearching(false);
      setMessageSenderFilter("");
      setIsSenderDropdownOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      latestSearchRequestRef.current += 1;
      const requestId = latestSearchRequestRef.current;

      try {
        setIsSearching(true);
        const data = await MessageService.searchEverything(
          normalizedUserId,
          keyword,
          {
            limit: 24,
          },
        );

        let mergedResults = data;

        if (keyword.length >= 2 && (data.messages?.length || 0) < 24) {
          const deepMatches = await deepSearchMessages(keyword, 24);

          const mergedById = new Map<string, SearchEverythingResponse["messages"][number]>();

          [...(data.messages || []), ...deepMatches].forEach((msg) => {
            const key = String(msg.msg_id || msg._id || "");
            if (!key || mergedById.has(key)) return;
            mergedById.set(key, msg);
          });

          const mergedMessages = [...mergedById.values()]
            .sort((a, b) => {
              const timeA = new Date(a.createdAt || 0).getTime();
              const timeB = new Date(b.createdAt || 0).getTime();
              return timeB - timeA;
            })
            .slice(0, 24);

          mergedResults = {
            ...data,
            messages: mergedMessages,
            total:
              (data.contacts?.length || 0) +
              (data.conversations?.length || 0) +
              mergedMessages.length +
              (data.files?.length || 0) +
              (data.media?.length || 0),
          };
        }

        if (requestId !== latestSearchRequestRef.current) return;
        setSearchResults(mergedResults);
      } catch (error) {
        console.error("Search failed:", error);
        if (requestId !== latestSearchRequestRef.current) return;
        setSearchResults(EMPTY_SEARCH);
      } finally {
        if (requestId !== latestSearchRequestRef.current) return;
        setIsSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    deepSearchMessages,
    keyword,
    normalizedUserId,
  ]);

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

      // Close search panel after user chooses any search result/history item.
      setSearchTerm("");
      setSearchResults(null);
      setIsSearchFocused(false);
      setSearchTab("all");
      setMessageSenderFilter("");
      setIsSenderDropdownOpen(false);
      setSenderSearchText("");

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
    const map = new Map<
      string,
      { name: string; avatar: string; senderNameById: Record<string, string> }
    >();

    conversations.forEach((item) => {
      const senderNameById: Record<string, string> = {};

      (item.conversation.participants || []).forEach((participant) => {
        const participantId = String(participant.user_id || participant._id || "").trim();
        if (!participantId) return;

        const preferredName =
          String(participant.nickname || "").trim() ||
          String(participant.display_name || "").trim() ||
          String(participant.name || "").trim() ||
          participantId;

        senderNameById[participantId] = preferredName;
      });

      map.set(item.conversation._id, {
        name:
          getConversationDisplayName(item.conversation, normalizedUserId) ||
          item.conversation.name ||
          "Đoạn chat",
        avatar:
          getConversationDisplayAvatar(item.conversation, normalizedUserId) ||
          "",
        senderNameById,
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

    const resolvedConversations = searchResults.conversations.map((conv) => {
      const resolvedName =
        conversationMetaMap.get(conv.conversation_id)?.name || conv.name;

      return {
        ...conv,
        name: resolvedName,
      };
    });

    const normalizedKeyword = keyword.toLowerCase();
    if (!normalizedKeyword) return resolvedConversations;

    return resolvedConversations.filter((conv) =>
      String(conv.name || "")
        .toLowerCase()
        .includes(normalizedKeyword),
    );
  }, [searchResults, keyword, conversationMetaMap]);

  const senderOptions = useMemo(() => {
    if (!searchResults) return [];
    const map = new Map<string, string>();

    searchResults.messages.forEach((msg) => {
      if (!msg.sender_id) return;
      if (!map.has(msg.sender_id)) {
        const senderFromConversation =
          conversationMetaMap
            .get(msg.conversation_id)
            ?.senderNameById?.[msg.sender_id] || "";

        map.set(
          msg.sender_id,
          senderFromConversation || msg.sender_name || msg.sender_id,
        );
      }
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [searchResults, conversationMetaMap]);

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
