import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Image,
  Link as LinkIcon,
  Play,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { URL_S3 } from "../../../config/api.config";
import type { StorageViewProps, StorageTab } from "../../../interfaces";
import Avatar from "../../common/Avatar";
import { getFileTypeData, getFileTypeLabel } from "../../../utils/fileTypeUtils";

type DatePreset = "all" | "7d" | "30d" | "90d" | "custom";

interface BaseItem {
  id: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  date: string;
}

interface MediaItem extends BaseItem {
  type: "image" | "video";
  key: string;
  imageIndex: number;
}

interface FileItem extends BaseItem {
  key: string;
  fileName: string;
}

interface LinkItem extends BaseItem {
  link: string;
}

const toDate = (dateInput: string | undefined) => {
  if (!dateInput) return null;
  const parsed = new Date(dateInput);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dateLabel = (dateInput: string) => {
  const parsed = toDate(dateInput);
  if (!parsed) return "Không rõ ngày";
  return `Ngày ${parsed.getDate()} Tháng ${parsed.getMonth() + 1}`;
};

const fileTypeFromName = (name: string) =>
  getFileTypeLabel((name.split(".").pop() || "").toLowerCase());

const fileNameFromKey = (key: string) => {
  const rawName = key.split("/").pop() || "File";
  const match = rawName.match(/^[a-f0-9]+_(.+)$/i);
  return match ? match[1] : rawName;
};

const groupByDate = <T extends BaseItem>(items: T[]) => {
  const grouped = new Map<string, T[]>();

  const sorted = [...items].sort((a, b) => {
    const dateA = toDate(a.date)?.getTime() || 0;
    const dateB = toDate(b.date)?.getTime() || 0;
    return dateB - dateA;
  });

  sorted.forEach((item) => {
    const key = dateLabel(item.date);
    const list = grouped.get(key) || [];
    list.push(item);
    grouped.set(key, list);
  });

  return [...grouped.entries()];
};

const StorageView: React.FC<StorageViewProps> = ({
  initialTab,
  onBack,
  messages,
  linkMessages = [],
  members = [],
  onMediaClick,
}) => {
  const [activeTab, setActiveTab] = useState<StorageTab>(initialTab);
  const [searchText, setSearchText] = useState("");
  const [senderSearch, setSenderSearch] = useState("");
  const [senderFilter, setSenderFilter] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDateValue, setToDateValue] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [openDropdown, setOpenDropdown] = useState<
    "sender" | "date" | "type" | null
  >(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCount = selectedItemIds.size;

  const toggleSelectMode = () => {
    setIsSelectMode((prev) => {
      if (prev) {
        setSelectedItemIds(new Set());
      }
      return !prev;
    });
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const memberMap = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string }>();
    members.forEach((member) => {
      map.set(member.user_id, {
        name:
          (member.nickname || "").trim() ||
          (member.name || "").trim() ||
          member.user_id,
        avatar: member.avatar || "",
      });
    });
    return map;
  }, [members]);

  const normalized = useMemo(() => {
    const mediaItems: MediaItem[] = [];
    const fileItems: FileItem[] = [];
    const linkItems: LinkItem[] = [];

    messages.forEach((message: any) => {
      const messageId = String(message._id || "");
      if (!messageId) return;

      const senderId = String(message.sender_id || "");
      const profile = memberMap.get(senderId);
      const senderName =
        profile?.name || message.sender_name || senderId || "Unknown";
      const senderAvatar = profile?.avatar || "";
      const date = String(message.createdAt || message.created_at || "");
      const type = String(message.type || "").toLowerCase();
      const contentArray = Array.isArray(message.content)
        ? message.content
        : [message.content];

      if (type === "image" || type === "video") {
        contentArray.forEach((item: any, index: number) => {
          const key = typeof item === "string" ? item : item?.url;
          if (!key) return;

          mediaItems.push({
            id: `${messageId}:${index}`,
            messageId,
            senderId,
            senderName,
            senderAvatar,
            date,
            type: type as "image" | "video",
            key,
            imageIndex: index,
          });
        });
      }

      if (type === "file") {
        contentArray.forEach((item: any, index: number) => {
          const key = typeof item === "string" ? item : item?.url;
          if (!key) return;

          fileItems.push({
            id: `${messageId}:${index}`,
            messageId,
            senderId,
            senderName,
            senderAvatar,
            date,
            key,
            fileName: fileNameFromKey(key),
          });
        });
      }

    });

    linkMessages.forEach((item: any) => {
      const messageId = String(item?._id || item?.msg_id || "");
      if (!messageId || !Array.isArray(item?.links)) return;

      const senderId = String(item?.sender_id || "");
      const profile = memberMap.get(senderId);
      const senderName = profile?.name || senderId || "Unknown";
      const senderAvatar = profile?.avatar || "";
      const date = String(item?.createdAt || "");

      item.links.forEach((link: string, idx: number) => {
        if (!link) return;
        linkItems.push({
          id: `${messageId}:link:${idx}`,
          messageId,
          senderId,
          senderName,
          senderAvatar,
          date,
          link,
        });
      });
    });

    return { mediaItems, fileItems, linkItems };
  }, [messages, linkMessages, memberMap]);

  const senders = useMemo(() => {
    const senderMap = new Map<string, string>();
    [...normalized.mediaItems, ...normalized.fileItems, ...normalized.linkItems].forEach(
      (item) => {
        if (!item.senderId) return;
        if (!senderMap.has(item.senderId)) {
          senderMap.set(item.senderId, item.senderName || item.senderId);
        }
      },
    );

    return [...senderMap.entries()].map(([id, name]) => {
      const member = memberMap.get(id);
      return {
        id,
        name,
        avatar: member?.avatar || "",
      };
    });
  }, [normalized, memberMap]);

  const filteredSenders = useMemo(() => {
    const query = senderSearch.trim().toLowerCase();
    if (!query) return senders;
    return senders.filter((sender) =>
      sender.name.toLowerCase().includes(query),
    );
  }, [senders, senderSearch]);

  const selectedSenderName =
    senders.find((sender) => sender.id === senderFilter)?.name || "Người gửi";

  const selectedDateLabel = (() => {
    if (datePreset === "7d") return "7 ngày trước";
    if (datePreset === "30d") return "30 ngày trước";
    if (datePreset === "90d") return "3 tháng trước";
    if (datePreset === "custom") {
      if (fromDate || toDateValue) return "Khoảng thời gian";
    }
    return "Ngày gửi";
  })();

  const fileTypeLabel = fileTypeFilter || "Loại";

  const isDateInRange = (dateValue: string) => {
    const date = toDate(dateValue);
    if (!date) return false;

    if (datePreset === "all") return true;

    const now = new Date();

    if (datePreset === "7d") {
      return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
    }

    if (datePreset === "30d") {
      return now.getTime() - date.getTime() <= 30 * 24 * 60 * 60 * 1000;
    }

    if (datePreset === "90d") {
      return now.getTime() - date.getTime() <= 90 * 24 * 60 * 60 * 1000;
    }

    if (datePreset === "custom") {
      const from = toDate(fromDate);
      const to = toDate(toDateValue);

      if (from && date < from) return false;
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        if (date > endOfDay) return false;
      }
    }

    return true;
  };

  const filteredMedia = useMemo(() => {
    return normalized.mediaItems.filter((item) => {
      if (senderFilter && item.senderId !== senderFilter) return false;
      if (!isDateInRange(item.date)) return false;
      return true;
    });
  }, [normalized.mediaItems, senderFilter, datePreset, fromDate, toDateValue]);

  const filteredFiles = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return normalized.fileItems.filter((item) => {
      if (senderFilter && item.senderId !== senderFilter) return false;
      if (!isDateInRange(item.date)) return false;
      if (fileTypeFilter && fileTypeFromName(item.fileName) !== fileTypeFilter) {
        return false;
      }
      if (query && !item.fileName.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [
    normalized.fileItems,
    searchText,
    senderFilter,
    datePreset,
    fromDate,
    toDateValue,
    fileTypeFilter,
  ]);

  const filteredLinks = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return normalized.linkItems.filter((item) => {
      if (senderFilter && item.senderId !== senderFilter) return false;
      if (!isDateInRange(item.date)) return false;
      if (query && !item.link.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [normalized.linkItems, searchText, senderFilter, datePreset, fromDate, toDateValue]);

  const tabs = [
    { id: "media" as StorageTab, label: "Ảnh/Video" },
    { id: "files" as StorageTab, label: "Files" },
    { id: "links" as StorageTab, label: "Links" },
  ];

  useEffect(() => {
    // Khi qua tab Files/Links: tắt/reset 2 bộ lọc Người gửi + Ngày gửi
    if (activeTab !== "media") {
      setSenderFilter("");
      setSenderSearch("");
      setDatePreset("all");
      setFromDate("");
      setToDateValue("");
      setOpenDropdown((prev) => (prev === "sender" || prev === "date" ? null : prev));
    }

    // Đổi tab thì reset vùng chọn để tránh chọn nhầm khác loại dữ liệu
    setSelectedItemIds(new Set());
  }, [activeTab]);

  const renderSenderDropdown = () => (
    <div className="relative">
      <button
        onClick={() =>
          setOpenDropdown((prev) => (prev === "sender" ? null : "sender"))
        }
        className="flex h-9 w-full cursor-pointer items-center justify-between rounded-full bg-gray-100 px-4 text-[13px] text-gray-700"
      >
        <span className="truncate">{selectedSenderName}</span>
        <ChevronDown size={14} className="text-gray-500" />
      </button>

      {openDropdown === "sender" && (
        <div className="absolute left-0 top-full z-20 mt-2 w-60 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-xl">
          <div className="relative mb-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={senderSearch}
              onChange={(e) => setSenderSearch(e.target.value)}
              placeholder="Tìm kiếm"
              className="h-9 w-full rounded-full bg-gray-100 pl-9 pr-3 text-[13px] outline-none"
            />
          </div>

          <button
            onClick={() => {
              setSenderFilter("");
              setOpenDropdown(null);
            }}
            className="mb-1 w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-50"
          >
            Tất cả
          </button>

          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {filteredSenders.map((sender) => (
              <button
                key={sender.id}
                onClick={() => {
                  setSenderFilter(sender.id);
                  setOpenDropdown(null);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-1.5 text-left hover:bg-gray-50"
              >
                <Avatar src={sender.avatar} name={sender.name} size={28} />
                <span className="truncate text-[14px] text-gray-800">{sender.name}</span>
              </button>
            ))}

            {filteredSenders.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500">Không tìm thấy người gửi</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderDateDropdown = () => (
    <div className="relative">
      <button
        onClick={() =>
          setOpenDropdown((prev) => (prev === "date" ? null : "date"))
        }
        className="flex h-9 w-full cursor-pointer items-center justify-between rounded-full bg-gray-100 px-4 text-[13px] text-gray-700"
      >
        <span className="truncate">{selectedDateLabel}</span>
        <ChevronDown size={14} className="text-gray-500" />
      </button>

      {openDropdown === "date" && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-2.5 shadow-xl">
          <div className="space-y-1">
            {[
              { id: "7d", label: "7 ngày trước" },
              { id: "30d", label: "30 ngày trước" },
              { id: "90d", label: "3 tháng trước" },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setDatePreset(preset.id as DatePreset);
                  setOpenDropdown(null);
                }}
                className={`w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-[13px] ${
                  datePreset === preset.id
                    ? "bg-amber-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => {
                setDatePreset("all");
                setFromDate("");
                setToDateValue("");
                setOpenDropdown(null);
              }}
              className="w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-50"
            >
              Tất cả thời gian
            </button>
          </div>

          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="mb-2 text-[12px] font-medium text-gray-700">Chọn khoảng thời gian</p>

            <div className="space-y-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setDatePreset("custom");
                }}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-[12px] outline-none focus:border-primary-400"
              />
              <input
                type="date"
                value={toDateValue}
                onChange={(e) => {
                  setToDateValue(e.target.value);
                  setDatePreset("custom");
                }}
                className="h-9 w-full rounded-lg border border-gray-200 px-3 text-[12px] outline-none focus:border-primary-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTypeDropdown = () => (
    <div className="relative">
      <button
        onClick={() =>
          setOpenDropdown((prev) => (prev === "type" ? null : "type"))
        }
        className="flex h-9 w-full cursor-pointer items-center justify-between rounded-full bg-gray-100 px-4 text-[13px] text-gray-700"
      >
        <span className="truncate">{fileTypeLabel}</span>
        <ChevronDown size={14} className="text-gray-500" />
      </button>

      {openDropdown === "type" && (
        <div className="absolute left-0 top-full z-20 mt-2 w-52 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
          {[
            "PDF",
            "Word",
            "PowerPoint",
            "Excel",
            "Khác",
          ].map((item) => (
            <button
              key={item}
              onClick={() => {
                setFileTypeFilter(item);
                setOpenDropdown(null);
              }}
              className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-50"
            >
              <FileText size={14} className="text-gray-500" />
              <span>{item}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setFileTypeFilter("");
              setOpenDropdown(null);
            }}
            className="w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-50"
          >
            Tất cả
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={dropdownRef} className="h-full flex flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <button
          onClick={onBack}
          className="cursor-pointer rounded-full p-1 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h3 className="flex-1 text-[17px] font-semibold text-gray-900">Kho lưu trữ</h3>
        <button
          onClick={toggleSelectMode}
          className="cursor-pointer text-[14px] font-medium text-gray-800 hover:text-gray-900"
        >
          {isSelectMode ? "Hủy" : "Chọn"}
        </button>
      </div>

      <div className="flex border-b border-gray-200 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchText("");
            }}
            className={`flex-1 cursor-pointer border-b-2 py-2 text-[14px] font-medium transition-colors ${
              activeTab === tab.id
                ? "border-amber-700 text-amber-700"
                : "border-transparent text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(activeTab === "files" || activeTab === "links") && (
        <div className="px-4 pt-4">
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={activeTab === "files" ? "Tìm kiếm File" : "Tìm kiếm link"}
              className="h-9 w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-[13px] outline-none focus:border-primary-400"
            />
          </div>
        </div>
      )}

      <div className="space-y-2 px-4 pb-3 pt-3">
        <div className={`grid gap-2 ${activeTab === "files" ? "grid-cols-1" : "grid-cols-2"}`}>
          {activeTab === "files" && (
            renderTypeDropdown()
          )}

          {activeTab === "media" && renderSenderDropdown()}
          {activeTab === "media" && renderDateDropdown()}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto custom-scrollbar ${isSelectMode ? "pb-20" : ""}`}>
        {activeTab === "media" && (
          <>
            {filteredMedia.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <Image size={52} className="mx-auto mb-3 text-gray-300" />
                Chưa có ảnh hoặc video
              </div>
            ) : (
              groupByDate(filteredMedia).map(([group, items]) => (
                <div key={group} className="border-t border-gray-100 px-4 py-4 first:border-t-0">
                  <h4 className="mb-2.5 text-[15px] font-semibold text-gray-800">{group}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (isSelectMode) {
                            toggleItemSelection(item.id);
                            return;
                          }
                          onMediaClick(item.messageId, item.imageIndex);
                        }}
                        className="relative cursor-pointer aspect-square overflow-hidden rounded-md bg-gray-100"
                      >
                        {item.type === "image" ? (
                          <img
                            src={`${URL_S3}${item.key}`}
                            alt="media"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <>
                            <video src={`${URL_S3}${item.key}`} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <span className="rounded-full bg-white/90 p-2">
                                <Play size={14} className="text-gray-700" />
                              </span>
                            </div>
                          </>
                        )}

                        {isSelectMode && (
                          <div
                            className={`absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                              selectedItemIds.has(item.id)
                                ? "border-amber-700 bg-amber-700 text-white"
                                : "border-white bg-black/25 text-transparent"
                            }`}
                          >
                            <Check size={12} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "files" && (
          <>
            {filteredFiles.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <FileText size={52} className="mx-auto mb-3 text-gray-300" />
                Chưa có file
              </div>
            ) : (
              groupByDate(filteredFiles).map(([group, items]) => (
                <div key={group} className="border-t border-gray-100 px-4 py-4 first:border-t-0">
                  <h4 className="mb-2.5 text-[15px] font-semibold text-gray-800">{group}</h4>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const ext = item.fileName.split(".").pop() || "";
                      const { Icon, bg, color } = getFileTypeData(ext);
                      const typeLabel = getFileTypeLabel(ext);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (isSelectMode) {
                              toggleItemSelection(item.id);
                              return;
                            }
                            window.open(`${URL_S3}${item.key}`, "_blank", "noopener,noreferrer");
                          }}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left hover:bg-gray-50 ${
                            isSelectMode && selectedItemIds.has(item.id)
                              ? "bg-amber-50 ring-1 ring-amber-200"
                              : ""
                          }`}
                        >
                          {isSelectMode && (
                            <span
                              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border ${
                                selectedItemIds.has(item.id)
                                  ? "border-primary-700 bg-primary-700 text-white"
                                  : "border-gray-300 bg-white text-transparent"
                              }`}
                            >
                              <Check size={10} />
                            </span>
                          )}

                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                            <Icon size={18} className={color} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-medium text-gray-900">{item.fileName}</p>
                            <div className="mt-0.5 flex items-center gap-1 text-[12px] text-amber-700">
                              <Clock3 size={12} />
                              <span>{typeLabel} • Tải về để xem lâu dài</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === "links" && (
          <>
            {filteredLinks.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <LinkIcon size={52} className="mx-auto mb-3 text-gray-300" />
                Chưa có link
              </div>
            ) : (
              groupByDate(filteredLinks).map(([group, items]) => (
                <div key={group} className="border-t border-gray-100 px-4 py-4 first:border-t-0">
                  <h4 className="mb-2.5 text-[15px] font-semibold text-gray-800">{group}</h4>
                  <div className="space-y-2">
                    {items.map((item) => {
                      let host = "";
                      try {
                        host = new URL(item.link).hostname;
                      } catch {
                        host = "";
                      }

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (isSelectMode) {
                              toggleItemSelection(item.id);
                              return;
                            }
                            window.open(item.link, "_blank", "noopener,noreferrer");
                          }}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left hover:bg-gray-50 ${
                            isSelectMode && selectedItemIds.has(item.id)
                              ? "bg-amber-50 ring-1 ring-amber-200"
                              : ""
                          }`}
                        >
                          {isSelectMode && (
                            <span
                              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border ${
                                selectedItemIds.has(item.id)
                                  ? "border-amber-700 bg-amber-700 text-white"
                                  : "border-gray-300 bg-white text-transparent"
                              }`}
                            >
                              <Check size={10} />
                            </span>
                          )}

                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                            <LinkIcon size={18} className="text-gray-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-medium text-gray-900">
                              {item.link.length > 45 ? `${item.link.slice(0, 45)}...` : item.link}
                            </p>
                            <p className="truncate text-[13px] text-amber-700">{host}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {isSelectMode && (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-[12px] font-semibold text-primary-600">
                {selectedCount}
              </span>
              <span className="text-[17px] font-semibold text-gray-900">hình ảnh</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600"
                title="Chia sẻ"
              >
                <Send size={15} />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-50 text-red-500"
                title="Xóa"
              >
                <Trash2 size={15} />
              </button>
              <button
                type="button"
                onClick={toggleSelectMode}
                className="cursor-pointer text-[17px] font-semibold text-gray-900"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageView;
