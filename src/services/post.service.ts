/**
 * post.service.ts
 * Tất cả các thao tác CRUD với bài post:
 *   GET  /posts              – danh sách toàn bộ
 *   GET  /posts/{id}         – chi tiết một bài
 *   GET  /posts/user/{uid}   – bài của một user
 *   POST /posts              – tạo bài mới (multipart, kèm upload ảnh lên S3)
 *   DELETE /posts/{id}       – xoá bài
 */

import { API_MEDIA_SERVER_URL } from "../config/api.config";
import type { Post, PostUser, PostMediaItem } from "../components/social/types";

/* ═══════════════════════════════════════════════════════
   Raw shapes trả về từ backend
═══════════════════════════════════════════════════════ */
export interface ApiMedia {
    id: string;
    type: "IMAGE_MEDIA" | "VIDEO_MEDIA";
    url: string;
    orderIndex: number;
    caption: string | null;
    thumbnailUrl: string | null;
}

export interface ApiPost {
    id: string;
    accountId: string;
    accountUsername: string;
    accountDisplayName: string;
    accountAvatarUrl: string | null;
    caption: string;
    medias: ApiMedia[] | null;
    totalReactions: number;
    totalComments: number;
    totalShares: number;
    createdAt: string;
    updatedAt: string;
    visibility: string;
    hashTags: string[] | null;
}

/* ═══════════════════════════════════════════════════════
   Helpers nội bộ
═══════════════════════════════════════════════════════ */
const AVATAR_COLORS = [
    "bg-primary-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-violet-500",
    "bg-sky-500",
];
const colorFor = (idx: number) => AVATAR_COLORS[idx % AVATAR_COLORS.length];

/** Chuyển ISO timestamp sang chuỗi tiếng Việt tương đối */
export function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Hôm qua";
    if (days < 7) return `${days} ngày trước`;
    return new Date(iso).toLocaleDateString("vi-VN");
}

/** ApiMedia[] → PostMediaItem[] */
export function mapMedia(medias: ApiMedia[] | null): PostMediaItem[] {
    if (!medias?.length) return [];
    return [...medias]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((m) => ({
            type: m.type === "VIDEO_MEDIA" ? "video" : "image",
            url: m.url,
        }));
}

/** ApiPost → Post (frontend model) */
export function mapPost(p: ApiPost, colorIndex: number, currentUserId?: string): Post {
    const author: PostUser = {
        id: p.accountId,
        name: p.accountDisplayName ?? p.accountUsername,
        avatar: p.accountAvatarUrl ?? undefined,
        color: colorFor(colorIndex),
    };
    return {
        id: p.id,
        author,
        time: relativeTime(p.createdAt),
        content: p.caption ?? "",
        media: mapMedia(p.medias),
        likes: p.totalReactions,
        comments: p.totalComments,
        shares: p.totalShares,
        visibility: p.visibility,
        relationship: p.accountId === currentUserId ? "self" : undefined,
    };
}

/** Unwrap response: backend có thể trả array thẳng hoặc { value: [...] } */
function unwrapList<T>(json: unknown): T[] {
    if (Array.isArray(json)) return json as T[];
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.value)) return obj.value as T[];
    return [];
}

/* ═══════════════════════════════════════════════════════
   Public API
═══════════════════════════════════════════════════════ */

/**
 * Lấy tất cả bài post, sắp xếp mới nhất lên trước.
 * Trả về null nếu backend không khả dụng hoặc danh sách rỗng.
 */
export async function fetchPosts(currentUserId?: string): Promise<Post[] | null> {
    try {
        const res = await fetch(`${API_MEDIA_SERVER_URL}/posts`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return null;

        const raw = unwrapList<ApiPost>(await res.json());
        if (!raw.length) return null;

        const colorMap = new Map<string, number>();
        let colorIdx = 0;

        return raw
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((p) => {
                if (!colorMap.has(p.accountId)) colorMap.set(p.accountId, colorIdx++);
                return mapPost(p, colorMap.get(p.accountId)!, currentUserId);
            });
    } catch {
        return null;
    }
}

/**
 * Lấy bài post của một user cụ thể.
 * Trả về mảng rỗng nếu không có hoặc backend lỗi.
 */
export async function fetchPostsByUser(userId: string, currentUserId?: string): Promise<Post[]> {
    try {
        const res = await fetch(`${API_MEDIA_SERVER_URL}/posts/user/${userId}`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return [];

        const raw = unwrapList<ApiPost>(await res.json());
        return raw
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((p, i) => mapPost(p, i, currentUserId));
    } catch {
        return [];
    }
}

/**
 * Lấy chi tiết một bài post theo ID.
 * Trả về null nếu không tìm thấy.
 */
export async function fetchPostById(postId: string, currentUserId?: string): Promise<Post | null> {
    try {
        const res = await fetch(`${API_MEDIA_SERVER_URL}/posts/${postId}`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return null;
        const p: ApiPost = await res.json();
        return mapPost(p, 0, currentUserId);
    } catch {
        return null;
    }
}

/**
 * Tạo bài post mới.
 * Upload ảnh lên S3 qua backend (multipart/form-data).
 * Trả về bài post đã lưu DB, hoặc null nếu lỗi.
 */
export async function createPost(
    accountId: string,
    caption: string,
    visibility: string,
    files: File[],
): Promise<Post | null> {
    try {
        const form = new FormData();
        form.append("accountId", accountId);
        form.append("caption", caption);
        form.append("visibility", visibility.toUpperCase());
        files.forEach((f) => form.append("files", f));

        const res = await fetch(`${API_MEDIA_SERVER_URL}/posts`, {
            method: "POST",
            body: form,
            signal: AbortSignal.timeout(30_000), // S3 upload có thể chậm
        });
        if (!res.ok) return null;

        const p: ApiPost = await res.json();
        return mapPost(p, 0, accountId); // author = chính mình
    } catch {
        return null;
    }
}

/**
 * Xoá bài post theo ID.
 * Trả về true nếu thành công.
 */
export async function deletePost(postId: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_MEDIA_SERVER_URL}/posts/${postId}`, {
            method: "DELETE",
            signal: AbortSignal.timeout(5_000),
        });
        return res.ok || res.status === 404; // 404 cũng coi là đã xoá
    } catch {
        return false;
    }
}

/* ═══════════════════════════════════════════════════════
   Like / Reaction API
═══════════════════════════════════════════════════════ */

export interface ToggleLikeResult {
    liked: boolean;
    totalReactions: number;
}

/**
 * Toggle like một bài post.
 * Trả về trạng thái liked + tổng số lượt thích sau toggle.
 */
export async function toggleLike(
    postId: string,
    accountId: string,
): Promise<ToggleLikeResult | null> {
    try {
        const url = new URL(`${API_MEDIA_SERVER_URL}/posts/${postId}/like`);
        url.searchParams.set("accountId", accountId);
        url.searchParams.set("reactionType", "LIKE");
        const res = await fetch(url.toString(), {
            method: "POST",
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            liked: data.liked as boolean,
            totalReactions: data.totalReactions as number,
        };
    } catch {
        return null;
    }
}

/* ═══════════════════════════════════════════════════════
   Comment API
═══════════════════════════════════════════════════════ */

export interface ApiComment {
    id: string;
    text: string;
    accountId: string;
    accountUsername: string;
    accountDisplayName: string | null;
    accountAvatarUrl: string | null;
    parentCommentId: string | null;
    isEdited: boolean;
    isDeleted: boolean;
    depth: number;
    totalReplies: number;
    totalReactions: number;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    text: string;
    parentId?: string;
    depth: number;
    isEdited: boolean;
    time: string;
    totalReplies: number;
}

function mapComment(c: ApiComment): Comment {
    return {
        id: c.id,
        authorId: c.accountId,
        authorName: c.accountDisplayName ?? c.accountUsername,
        authorAvatar: c.accountAvatarUrl ?? undefined,
        text: c.text,
        parentId: c.parentCommentId ?? undefined,
        depth: c.depth,
        isEdited: c.isEdited,
        time: relativeTime(c.createdAt),
        totalReplies: c.totalReplies,
    };
}

/**
 * Lấy danh sách comments của bài post.
 */
export async function fetchComments(postId: string): Promise<Comment[]> {
    try {
        const res = await fetch(`${API_MEDIA_SERVER_URL}/posts/${postId}/comments`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return [];
        const raw = await res.json();
        const list: ApiComment[] = Array.isArray(raw) ? raw : (raw.value ?? []);
        return list.filter((c) => !c.isDeleted).map(mapComment);
    } catch {
        return [];
    }
}

/**
 * Thêm comment vào bài post.
 */
export async function addComment(
    postId: string,
    accountId: string,
    text: string,
    parentCommentId?: string,
): Promise<Comment | null> {
    try {
        const url = new URL(`${API_MEDIA_SERVER_URL}/posts/${postId}/comments`);
        url.searchParams.set("accountId", accountId);
        url.searchParams.set("text", text);
        if (parentCommentId) url.searchParams.set("parentCommentId", parentCommentId);
        const res = await fetch(url.toString(), {
            method: "POST",
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return null;
        return mapComment(await res.json() as ApiComment);
    } catch {
        return null;
    }
}

/**
 * Xoá comment.
 */
export async function deleteComment(postId: string, commentId: string): Promise<boolean> {
    try {
        const res = await fetch(
            `${API_MEDIA_SERVER_URL}/posts/${postId}/comments/${commentId}`,
            { method: "DELETE", signal: AbortSignal.timeout(5_000) },
        );
        return res.ok || res.status === 404;
    } catch {
        return false;
    }
}
