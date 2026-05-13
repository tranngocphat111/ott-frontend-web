import { API_MEDIA_SERVER_URL } from "../config/api.config";
import type {
    StoryItem,
    StoryReelData,
    StorySuggestedUser,
    StoryUserGroup,
} from "../components/social/types";
import { authFetch } from "./api/fetchClient";

export interface ApiStory {
    id: string;
    accountId: string;
    accountUsername: string;
    accountDisplayName: string | null;
    accountAvatarUrl: string | null;
}

export interface ApiSuggestedUser {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
}

export interface ApiStoryReel {
    storyGroups?: ApiStoryGroup[];
    stories?: ApiStory[];
    suggestedUsers: ApiSuggestedUser[];
}

export interface ApiStoryGroup {
    accountId: string;
    accountUsername: string;
    accountDisplayName: string | null;
    accountAvatarUrl: string | null;
    stories: ApiStoryReelItem[];
}

export interface ApiStoryReelItem {
    id: string;
    accountAvatarUrl: string | null;
    storyItems?: ApiStoryItemResponse[];
}

export interface ApiStoryItemResponse {
    type: "TEXT_ITEM" | "IMAGE_ITEM" | "VIDEO_ITEM";
    imageItem?: {
        url?: string | null;
    } | null;
    videoItem?: {
        url?: string | null;
        thumbnailUrl?: string | null;
    } | null;
    textItem?: {
        content?: string | null;
        backgroundColor?: string | null;
    } | null;
}

export interface StoryCreateRequest {
    userId: string;
    visibility?: string;
    isHighlight?: boolean;
    highlightName?: string | null;
    expireAt?: string | null;
    storyItems?: unknown[];
    musics?: unknown[];
    hashTags?: string[];
    accessControls?: unknown[];
    mentions?: unknown[];
}

export interface StoryUploadResponse {
    storyItemId?: string | null;
    fileKey: string;
}

function unwrapApiResult<T>(payload: unknown): T | null {
    if (!payload) return null;

    // Handle Jackson Polymorphic Array: ["className", { ...data }]
    if (
        Array.isArray(payload) &&
        payload.length === 2 &&
        typeof payload[0] === "string"
    ) {
        return payload[1] as T;
    }

    if (typeof payload !== "object") return null;
    if ("result" in (payload as any)) return (payload as any).result ?? null;
    return payload as T;
}

function unwrapList<T>(json: unknown): T[] {
    const data = unwrapApiResult<T[]>(json);
    if (!Array.isArray(data)) {
        const obj = data as any;
        if (obj && Array.isArray(obj.value)) return obj.value;
        return [];
    }
    // Each element might be ["className", {data}]
    return data
        .map((item) => unwrapApiResult<T>(item))
        .filter((item) => item !== null) as T[];
}

function groupStories(raw: ApiStory[]): StoryUserGroup[] {
    const groups = new Map<string, StoryUserGroup>();

    for (const story of raw) {
        const userId = story.accountId;
        const name = story.accountDisplayName ?? story.accountUsername;
        const item: StoryItem = {
            id: story.id,
            name,
            isBirthday: false,
            userId,
            avatarUrl: story.accountAvatarUrl ?? undefined,
        };

        const existing = groups.get(userId);
        if (existing) {
            existing.stories.push(item);
        } else {
            groups.set(userId, {
                userId,
                name,
                avatarUrl: story.accountAvatarUrl ?? undefined,
                stories: [item],
            });
        }
    }

    return Array.from(groups.values());
}

function mapStoryGroups(raw: ApiStoryGroup[]): StoryUserGroup[] {
    return raw.map((group) => ({
        userId: group.accountId,
        name: group.accountDisplayName ?? group.accountUsername,
        avatarUrl: group.accountAvatarUrl ?? undefined,
        stories: group.stories.map((story) => {
            const firstRenderableItem = story.storyItems?.find(
                (item) =>
                    item?.type === "TEXT_ITEM" ||
                    item?.type === "IMAGE_ITEM" ||
                    item?.type === "VIDEO_ITEM",
            );

            const textContent =
                firstRenderableItem?.type === "TEXT_ITEM" ?
                    firstRenderableItem.textItem?.content ?? undefined
                    : undefined;

            const textBackgroundColor =
                firstRenderableItem?.type === "TEXT_ITEM" ?
                    firstRenderableItem.textItem?.backgroundColor ?? undefined
                    : undefined;

            const imageUrl =
                firstRenderableItem?.type === "IMAGE_ITEM" ?
                    firstRenderableItem.imageItem?.url ?? undefined
                    : undefined;

            const videoUrl =
                firstRenderableItem?.type === "VIDEO_ITEM" ?
                    firstRenderableItem.videoItem?.url ?? undefined
                    : undefined;

            return {
                id: story.id,
                name: group.accountDisplayName ?? group.accountUsername,
                isBirthday: false,
                userId: group.accountId,
                avatarUrl: story.accountAvatarUrl ?? group.accountAvatarUrl ?? undefined,
                contentType:
                    firstRenderableItem?.type === "TEXT_ITEM" ? "TEXT"
                        : firstRenderableItem?.type === "IMAGE_ITEM" ? "IMAGE"
                            : firstRenderableItem?.type === "VIDEO_ITEM" ? "VIDEO"
                                : "UNKNOWN",
                textContent,
                textBackgroundColor,
                imageUrl,
                videoUrl,
            };
        }),
    }));
}

function mapSuggestedUsers(raw: ApiSuggestedUser[]): StorySuggestedUser[] {
    return raw.map((user) => ({
        id: user.id,
        name: user.displayName || user.username || "Người dùng",
        avatarUrl: user.avatarUrl ?? undefined,
    }));
}

export async function fetchStoryGroups(accountId: string): Promise<StoryUserGroup[]> {
    try {
        if (!accountId) return [];

        const reelRes = await authFetch(
            `${API_MEDIA_SERVER_URL}/stories/reel/${accountId}?suggestionLimit=0`,
        );

        if (reelRes.ok) {
            const json = await reelRes.json();
            const reel = unwrapApiResult<ApiStoryReel>(json);
            if (!reel) return [];
            
            const storyGroups = unwrapList<ApiStoryGroup>(reel.storyGroups);
            if (storyGroups.length > 0) {
                return mapStoryGroups(storyGroups);
            }
            if (Array.isArray(reel.stories) && reel.stories.length > 0) {
                return groupStories(reel.stories);
            }

            return [];
        }

        const fallbackRes = await authFetch(`${API_MEDIA_SERVER_URL}/stories`);
        if (!fallbackRes.ok) return [];
        const fallbackStories = unwrapList<ApiStory>(await fallbackRes.json());
        return groupStories(fallbackStories);
    } catch {
        return [];
    }
}

export async function fetchSuggestedUsers(accountId: string, limit = 8): Promise<StorySuggestedUser[]> {
    try {
        if (!accountId) return [];

        const reelRes = await authFetch(
            `${API_MEDIA_SERVER_URL}/stories/reel/${accountId}?suggestionLimit=${limit}`,
        );

        if (!reelRes.ok) return [];
        const json = await reelRes.json();
        const reel = unwrapApiResult<ApiStoryReel>(json);
        if (!reel) return [];
        
        const suggestedUsers = unwrapList<ApiSuggestedUser>(reel.suggestedUsers);
        return mapSuggestedUsers(suggestedUsers);
    } catch {
        return [];
    }
}

export async function fetchStories(accountId: string): Promise<StoryReelData> {
    const storyGroups = await fetchStoryGroups(accountId);
    return { storyGroups, suggestedUsers: [] };
}

export async function createStory(request: StoryCreateRequest): Promise<ApiStory | null> {
    try {
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/stories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
            signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return unwrapApiResult<ApiStory>(json);
    } catch {
        return null;
    }
}

export async function uploadStoryMedia(file: File, storyItemId?: string): Promise<StoryUploadResponse | null> {
    try {
        const formData = new FormData();
        formData.append("file", file);
        if (storyItemId) {
            formData.append("storyItemId", storyItemId);
        }

        const res = await authFetch(`${API_MEDIA_SERVER_URL}/stories/upload`, {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return unwrapApiResult<StoryUploadResponse>(json);
    } catch {
        return null;
    }
}
export async function deleteStory(storyId: string): Promise<boolean> {
    try {
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/stories/${storyId}`, {
            method: "DELETE",
            signal: AbortSignal.timeout(5_000),
        });
        return res.ok;
    } catch {
        return false;
    }
}
