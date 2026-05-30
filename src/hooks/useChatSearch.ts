import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageService, UserService, ConversationService } from "../services";
import type { SearchContactItem } from "../types/search.type";
import {
  getConversationDisplayAvatar,
  getConversationDisplayName,
} from "../utils";
import {
  VIRTUAL_CONV_PREFIX,
  buildVirtualPrivateConversationItem,
  cacheVirtualConversation,
} from "../utils/chatConversation";
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

export { VIRTUAL_CONV_PREFIX };

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
  const [virtualConversationsCache, setVirtualConversationsCache] = useState<Record<string, ConversationWithParticipant>>({});
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

  // Removed deepSearchMessages to optimize performance. 
  // Backend searchEverything is now responsible for global message searching.

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
        const scope = searchTab === "all" ? ["all"] : [searchTab];

        const data = await MessageService.searchEverything(
          normalizedUserId,
          keyword,
          {
            limit: 24,
            scope,
          },
        );

        // Merge contacts into conversations for the UI
        if (data.contacts?.length > 0) {
          const contactConversations: any[] = data.contacts.map(contact => {
            // 1. Check if it's in our LOCAL visible conversations
            const existingVisible = conversations.find(c => 
              c.conversation.type === "private" && 
              c.conversation.participants?.some(p => String(p.user_id || (p as any)._id) === String(contact.user_id))
            );

            if (existingVisible) {
              return {
                conversation_id: existingVisible.conversation._id,
                contact_id: contact.user_id,
                type: "private",
                name: contact.name,
                avatar: contact.avatar,
                phone: contact.phone,
                is_virtual: false,
                last_message: existingVisible.conversation.last_message
              };
            }

            // 2. Check if the backend returned an existing conversation ID (could be a hidden/deleted one)
            const dbConvId = contact.conversation_ids?.[0];
            if (dbConvId) {
              return {
                conversation_id: dbConvId,
                contact_id: contact.user_id,
                type: "private",
                name: contact.name,
                avatar: contact.avatar,
                phone: contact.phone,
                is_virtual: false // It exists in DB, just hidden from main list
              };
            }

            // 3. Otherwise, it's a true stranger (virtual)
            return {
              conversation_id: "", 
              contact_id: contact.user_id,
              type: "private",
              name: contact.name,
              avatar: contact.avatar,
              phone: contact.phone,
              is_virtual: true
            };
          });
          
          // Filter out ones that are already in data.conversations (by ID)
          const finalToAdd = contactConversations.filter(vc => 
            !(data.conversations || []).some((c: any) => c.conversation_id === vc.conversation_id)
          );
          
          data.conversations = [...finalToAdd, ...(data.conversations || [])];
          data.contacts = []; 
        }

        // Enrich results with local data if available to ensure consistent avatars/names
        if (data.conversations) {
          data.conversations = data.conversations.map((conv: any) => {
            const existingVisible = conversations.find(c => c.conversation._id === conv.conversation_id);
            if (existingVisible) {
              const localName = getConversationDisplayName(existingVisible.conversation, normalizedUserId);
              const localAvatar = getConversationDisplayAvatar(existingVisible.conversation, normalizedUserId);
              return {
                ...conv,
                name: localName || conv.name,
                avatar: localAvatar || conv.avatar,
              };
            }
            return conv;
          });
        }

        // Recalculate total after merging
        data.total =
          (data.conversations?.length || 0) +
          (data.messages?.length || 0) +
          (data.files?.length || 0) +
          (data.media?.length || 0);

        if (requestId !== latestSearchRequestRef.current) return;
        setSearchResults(data);
      } catch (error) {
        console.error("Search failed:", error);
        if (requestId !== latestSearchRequestRef.current) return;
        setSearchResults(EMPTY_SEARCH);
      } finally {
        if (requestId !== latestSearchRequestRef.current) return;
        setIsSearching(false);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    keyword,
    normalizedUserId,
    searchTab,
  ]);

  useEffect(() => {
    if (!normalizedUserId) return;
    const cacheKey = `virtual_conv_cache_${normalizedUserId}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        setVirtualConversationsCache(JSON.parse(raw));
      }
    } catch (e) {
      console.error("Failed to load virtual conversation cache", e);
    }
  }, [normalizedUserId]);

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
        .filter((id) => 
          id.startsWith(VIRTUAL_CONV_PREFIX) || 
          conversations.some((item) => item.conversation._id === id)
        );
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
    async (conversationId: string, messageId?: string, contactId?: string) => {
      let targetConvId = conversationId;
      let targetConv: ConversationWithParticipant | undefined;

      if (!targetConvId && contactId && normalizedUserId) {
        try {
          const existingConv = conversations.find(c => 
            c.conversation.type === "private" && 
            c.conversation.participants?.some(p => String(p.user_id || (p as any)._id) === String(contactId))
          );

          if (existingConv) {
            targetConv = existingConv;
            targetConvId = existingConv.conversation._id;
          } else {
            // Don't call getOrCreatePrivateConversation yet (Lazy creation)
            // Instead, create a virtual conversation object
            const targetUser = await UserService.getUserById(contactId);
            if (targetUser) {
              targetConv = buildVirtualPrivateConversationItem({
                currentUserId: normalizedUserId,
                targetUserId: contactId,
                targetName: targetUser.display_name || targetUser.name,
                targetAvatar: targetUser.avatar || "",
              });
              targetConvId = targetConv.conversation._id;
              
              // Cache it
              setVirtualConversationsCache(prev => ({
                ...prev,
                [targetConvId]: targetConv!
              }));
              cacheVirtualConversation(normalizedUserId, targetConv);
            }
          }
        } catch (error) {
          console.error("Failed to get/create virtual conversation", error);
          return;
        }
      }

      if (!targetConvId) return;

      if (!targetConv) {
        targetConv = conversations.find(
          (item) => item.conversation._id === targetConvId,
        );
      }

      // 2.5 If still not found, check our virtual cache (for history items)
      if (!targetConv && targetConvId?.startsWith(VIRTUAL_CONV_PREFIX)) {
        targetConv = virtualConversationsCache[targetConvId];
      }

      // 3. If still not found but we have a real ID, fetch it from server (for hidden/deleted chats)
      if (!targetConv && targetConvId && !targetConvId.startsWith(VIRTUAL_CONV_PREFIX)) {
        try {
          const fetchedConv = await ConversationService.getConversationById(targetConvId);
          if (fetchedConv) {
            targetConv = {
              conversation: fetchedConv,
              participant: {
                user_id: normalizedUserId,
                conversation_id: targetConvId,
                roles: "user",
                settings: { is_pinned: false, notification_status: "on" }
              } as any
            };
          }
        } catch (error) {
          console.error("Failed to fetch hidden conversation", error);
        }
      }

      if (!targetConv) {
        return;
      }

      const nextHistory = [
        targetConvId,
        ...searchHistoryConversationIds.filter((id) => id !== targetConvId),
      ].slice(0, 20);
      setSearchHistoryConversationIds(nextHistory);
      try {
        localStorage.setItem(searchHistoryKey, JSON.stringify(nextHistory));
      } catch {
        // ignore localStorage write failures
      }

      onConversationSelect?.(targetConv);

      // Close search panel
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
      virtualConversationsCache,
      normalizedUserId,
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
        if (matched) return matched;
        
        // Try to find in virtual cache
        if (conversationId.startsWith(VIRTUAL_CONV_PREFIX)) {
          return virtualConversationsCache[conversationId] || null;
        }
        
        return null;
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

    return resolvedConversations.filter((conv) => {
      const nameMatch = String(conv.name || "")
        .toLowerCase()
        .includes(normalizedKeyword);
      
      const phoneMatch = String((conv as any).phone || "")
        .toLowerCase()
        .includes(normalizedKeyword);

      return nameMatch || phoneMatch;
    });
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
