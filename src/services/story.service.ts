import { API_MEDIA_SERVER_URL } from "../config/api.config";
import type {
    StoryItem,
    StoryReelData,
    StorySuggestedUser,
    StoryUserGroup,
} from "../components/social/types";

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

function unwrapList<T>(json: unknown): T[] {
    if (Array.isArray(json)) return json as T[];
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.value)) return obj.value as T[];
    return [];
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
        name: user.displayName ?? user.username,
    }));
}

export async function fetchStoryGroups(accountId: string): Promise<StoryUserGroup[]> {
    try {
        if (!accountId) return [];

        const reelRes = await fetch(
            `${API_MEDIA_SERVER_URL}/stories/reel/${accountId}?suggestionLimit=0`,
        );

        if (reelRes.ok) {
            const reel = (await reelRes.json()) as ApiStoryReel;
            if (Array.isArray(reel.storyGroups) && reel.storyGroups.length > 0) {
                return mapStoryGroups(reel.storyGroups);
            }
            if (Array.isArray(reel.stories) && reel.stories.length > 0) {
                return groupStories(reel.stories);
            }
        }

        const fallbackRes = await fetch(`${API_MEDIA_SERVER_URL}/stories`);
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

        const reelRes = await fetch(
            `${API_MEDIA_SERVER_URL}/stories/reel/${accountId}?suggestionLimit=${limit}`,
        );

        if (!reelRes.ok) return [];
        const reel = (await reelRes.json()) as ApiStoryReel;
        if (!Array.isArray(reel.suggestedUsers)) return [];
        return mapSuggestedUsers(reel.suggestedUsers);
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
        const res = await fetch(`${API_MEDIA_SERVER_URL}/stories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
            signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) return null;
        return (await res.json()) as ApiStory;
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

        const res = await fetch(`${API_MEDIA_SERVER_URL}/stories/upload`, {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) return null;
        return (await res.json()) as StoryUploadResponse;
    } catch {
        return null;
    }
}
