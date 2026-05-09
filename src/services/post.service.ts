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
import { authFetch } from "./api/fetchClient";

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
    accessControls?: { accountId: string; ruleType: "INCLUDE" | "EXCLUDE" }[];
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
export function relativeTime(iso: string | null | undefined): string {
    if (!iso) return "Vừa xong";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Vừa xong";
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Hôm qua";
    if (days < 7) return `${days} ngày trước`;
    return d.toLocaleDateString("vi-VN");
}

/** ApiMedia[] → PostMediaItem[] */
export function mapMedia(medias: ApiMedia[] | null): PostMediaItem[] {
    if (!medias?.length) return [];
    return [...medias]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((m) => ({
            type: m.type === "VIDEO_MEDIA" ? "video" : "image",
            url: m.url,
            id: m.id,
            caption: m.caption,
        }));
}

/** ApiPost → Post (frontend model) */
export function mapPost(p: ApiPost, colorIndex: number, currentUserId?: string): Post {
    const author: PostUser = {
        id: p.accountId,
        name: p.accountDisplayName ?? p.accountUsername,
        displayName: p.accountDisplayName ?? p.accountUsername,
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
        accessControls: p.accessControls,
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
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/posts`,
            //     {
            //     signal: AbortSignal.timeout(5_000),
            // }
        );
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

/** Kết quả phân trang posts */
export interface PostsPage {
    posts: Post[];
    totalPages: number;
    totalElements: number;
    page: number;
    hasMore: boolean;
}

/**
 * Lấy posts có phân trang từ GET /posts/page.
 * @param page    Số trang bắt đầu từ 0
 * @param size    Số bài mỗi trang (mặc định 10)
 */
export async function fetchPostsWithPage(
    page: number = 0,
    size: number = 10,
    currentUserId?: string,
): Promise<PostsPage | null> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/posts/page?page=${page}&size=${size}&sort=createdAt,desc`,
            { signal: AbortSignal.timeout(10_000) },
        );
        if (!res.ok) return null;

        const data: SpringPage<ApiPost> = await res.json();
        const colorMap = new Map<string, number>();
        let colorIdx = 0;

        const posts = (data.content ?? []).map((p) => {
            if (!colorMap.has(p.accountId)) colorMap.set(p.accountId, colorIdx++);
            return mapPost(p, colorMap.get(p.accountId)!, currentUserId);
        });

        return {
            posts,
            totalPages: data.totalPages,
            totalElements: data.totalElements,
            page: data.number,
            hasMore: !data.last,
        };
    } catch {
        return null;
    }
}

export async function findPostsWithAuthorized(
    page: number = 0,
    size: number = 10,
    currentUserId?: string,
): Promise<PostsPage | null> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/posts/page/${currentUserId}?page=${page}&size=${size}&sort=createdAt,desc`,
            { signal: AbortSignal.timeout(10_000) },
        );
        if (!res.ok) return null;

        const data: SpringPage<ApiPost> = await res.json();
        const colorMap = new Map<string, number>();
        let colorIdx = 0;

        const posts = (data.content ?? []).map((p) => {
            if (!colorMap.has(p.accountId)) colorMap.set(p.accountId, colorIdx++);
            return mapPost(p, colorMap.get(p.accountId)!, currentUserId);
        });

        return {
            posts,
            totalPages: data.totalPages,
            totalElements: data.totalElements,
            page: data.number,
            hasMore: !data.last,
        };
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
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/posts/user/${userId}`);
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
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/posts/${postId}`, {
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
function buildUploadErrorMessage(
    actionLabel: string,
    status: number,
    bodyText?: string,
): string {
    const normalized = bodyText?.toLowerCase() ?? "";
    if (normalized.includes("max_media_count_exceeded")) {
        return "Bạn đã chọn quá nhiều file. Tối đa 20 file.";
    }
    if (normalized.includes("filecountlimitexceededexception")) {
        return "Bạn đã chọn quá nhiều file. Vui lòng giảm số lượng và thử lại.";
    }
    if (normalized.includes("filesizelimitexceededexception")) {
        return "Một hoặc nhiều file vượt quá giới hạn dung lượng.";
    }
    if (normalized.includes("sizelimitexceededexception")) {
        return "Tổng dung lượng upload vượt quá giới hạn cho phép.";
    }
    if (normalized.includes("failed to parse multipart")) {
        return "Upload thất bại. Vui lòng kiểm tra số lượng hoặc dung lượng file.";
    }
    return `${actionLabel} thất bại (${status}). Vui lòng thử lại.`;
}

export async function createPost(
    accountId: string,
    caption: string,
    visibility: string,
    files: File[],
    captions?: string[],
    accessControls?: { accountId: string; ruleType: "INCLUDE" | "EXCLUDE" }[],
): Promise<{ post: Post | null; error?: string }> {
    try {
        const form = new FormData();
        form.append("accountId", accountId);
        form.append("caption", caption);
        form.append("visibility", visibility.toUpperCase());
        if (accessControls && accessControls.length > 0) {
            form.append("accessControls", JSON.stringify(accessControls));
        }
        files.forEach((f) => form.append("files", f));
        // Per-file captions – gửi theo đúng thứ tự file
        if (captions && captions.length > 0) {
            captions.forEach((c) => form.append("captions", c));
        }

        const res = await authFetch(`${API_MEDIA_SERVER_URL}/posts`, {
            method: "POST",
            body: form,
            signal: AbortSignal.timeout(30_000), // S3 upload có thể chậm
        });

        if (!res.ok) {
            let errBody: string | undefined;
            try {
                errBody = await res.text();
                console.error(`[createPost] Backend error ${res.status}:`, errBody);
            } catch {
                console.error(`[createPost] Backend error ${res.status}: (no body)`);
            }
            return {
                post: null,
                error: buildUploadErrorMessage("Tạo bài viết", res.status, errBody),
            };
        }

        const p: ApiPost = await res.json();
        return { post: mapPost(p, 0, accountId) };
    } catch (err) {
        console.error("[createPost] Network/timeout error:", err);
        return {
            post: null,
            error: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
        };
    }
}

/**
 * Cap nhat noi dung bai post.
 * Chi ho tro caption + visibility.
 */
export async function updatePost(
    postId: string,
    accountId: string,
    caption: string,
    visibility: string,
    media: Array<PostMediaItem & { file?: File }>,
    accessControls?: { accountId: string; ruleType: "INCLUDE" | "EXCLUDE" }[],
): Promise<{ post: Post | null; error?: string }> {
    try {
        const form = new FormData();
        form.append("accountId", accountId);
        form.append("caption", caption);
        form.append("visibility", visibility.toUpperCase());

        if (accessControls && accessControls.length > 0) {
            form.append("accessControls", JSON.stringify(accessControls));
        }

        const existingMedias = media
            .filter((m) => !m.file)
            .map((m, index) => ({
                type: m.type === "video" ? "VIDEO_MEDIA" : "IMAGE_MEDIA",
                url: m.url,
                caption: m.caption ?? null,
                orderIndex: index,
            }));

        if (existingMedias.length > 0) {
            form.append("existingMedias", JSON.stringify(existingMedias));
        }

        const newMedia = media.filter((m) => m.file) as Array<
            PostMediaItem & { file: File }
        >;
        newMedia.forEach((m) => {
            const file = m.file;
            form.append("files", file);
            form.append("captions", m.caption ?? "");
        });

        const res = await authFetch(`${API_MEDIA_SERVER_URL}/posts/${postId}`, {
            method: "PUT",
            body: form,
            signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) {
            let errBody: string | undefined;
            try {
                errBody = await res.text();
                console.error(`[updatePost] Backend error ${res.status}:`, errBody);
            } catch {
                console.error(`[updatePost] Backend error ${res.status}: (no body)`);
            }
            return {
                post: null,
                error: buildUploadErrorMessage(
                    "Cập nhật bài viết",
                    res.status,
                    errBody,
                ),
            };
        }
        const p: ApiPost = await res.json();
        return { post: mapPost(p, 0, accountId) };
    } catch (err) {
        console.error("[updatePost] Network/timeout error:", err);
        return {
            post: null,
            error: "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
        };
    }
}

/**
 * Xoá bài post theo ID.
 * Trả về true nếu thành công.
 */
export async function deletePost(postId: string): Promise<boolean> {
    try {
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/posts/${postId}`, {
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
    /** Loại reaction được backend xác nhận, e.g. "LIKE" | "LOVE" | ... */
    reactionType?: string;
}

/**
 * Toggle like/react một bài post.
 * @param reactionType Loại reaction (mặc định "LIKE"). Ví dụ: "LOVE", "HAHA", …
 */
export async function toggleLike(
    postId: string,
    accountId: string,
    reactionType: string = "LIKE",
): Promise<ToggleLikeResult | null> {
    try {
        const url = new URL(`${API_MEDIA_SERVER_URL}/posts/${postId}/like`);
        url.searchParams.set("accountId", accountId);
        url.searchParams.set("reactionType", reactionType.toUpperCase());
        const res = await authFetch(url.toString(), {
            method: "POST",
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return {
            liked: data.liked as boolean,
            totalReactions: data.totalReactions as number,
            reactionType: (data.reaction as { reactionType?: string } | undefined)?.reactionType,
        };
    } catch {
        return null;
    }
}

/* ─── Reaction shape từ API ─── */
export interface ApiReaction {
    id: string;
    accountId: string;
    accountUsername?: string;
    accountDisplayName?: string;
    accountAvatarUrl?: string;
    targetId: string;   // postId
    targetType: string;
    reactionType: string; // "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY"
}

/**
 * Lấy toàn bộ reactions mà một user đã thực hiện.
 * Dùng để khôi phục trạng thái emoji sau khi reload trang.
 */
export async function fetchUserReactions(accountId: string): Promise<ApiReaction[]> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/posts/reactions/by-account?accountId=${encodeURIComponent(accountId)}`,
            { signal: AbortSignal.timeout(5_000) },
        );
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

/**
 * Lấy số lượng từng loại reaction của một bài post.
 * TRẢ VỀ: { like: 3, love: 1, haha: 0, ... } (không phụ thuộc user)
 */
export async function fetchPostReactions(postId: string): Promise<Record<string, number>> {
    try {
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/posts/${postId}/reactions`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return {};
        const data: ApiReaction[] = await res.json();
        const counts: Record<string, number> = {};
        for (const r of data) {
            const key = r.reactionType.toLowerCase();
            counts[key] = (counts[key] ?? 0) + 1;
        }
        return counts;
    } catch {
        return {};
    }
}

/**
 * Lấy danh sách chi tiết reactions của một bài post (bao gồm thông tin user).
 */
export async function fetchPostReactionDetails(postId: string): Promise<ApiReaction[]> {
    try {
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/posts/${postId}/reactions`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return [];
        return await res.json() as ApiReaction[];
    } catch {
        return [];
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
    edited: boolean;
    deleted: boolean;
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

export function mapComment(c: ApiComment): Comment {
    return {
        id: c.id,
        authorId: c.accountId,
        authorName: c.accountDisplayName ?? c.accountUsername,
        authorAvatar: c.accountAvatarUrl ?? undefined,
        text: c.text,
        parentId: c.parentCommentId ?? undefined,
        depth: c.depth,
        isEdited: c.edited,
        time: relativeTime(c.createdAt ?? new Date().toISOString()),
        totalReplies: c.totalReplies,
    };
}

/** Kết quả phân trang comment */
export interface CommentPage {
    comments: Comment[];
    totalElements: number;
    totalPages: number;
    page: number;
    hasMore: boolean;
}

interface SpringPage<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    last: boolean;
}

/**
 * Lấy root comments (depth=0) của bài post theo trang.
 * Mặc định: page=0, size=20.
 * Nếu endpoint phân trang chưa có trên backend, tự fallback về endpoint legacy.
 */
export async function fetchRootComments(
    postId: string,
    page = 0,
    size = 20,
): Promise<CommentPage> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/posts/${postId}/comments/root?page=${page}&size=${size}`,
            { signal: AbortSignal.timeout(8_000) },
        );

        // Fallback to legacy endpoint on any failure
        if (!res.ok) {
            console.warn(`[fetchRootComments] /comments/root returned ${res.status}, falling back to legacy endpoint`);
            return fetchRootCommentsFallback(postId, page, size);
        }

        const data: SpringPage<ApiComment> = await res.json();
        const content: ApiComment[] = Array.isArray(data.content) ? data.content : [];
        console.debug(`[fetchRootComments] Got ${content.length} root comments from paginated endpoint`);
        return {
            comments: content.filter((c) => !c.deleted).map(mapComment),
            totalElements: data.totalElements ?? 0,
            totalPages: data.totalPages ?? 1,
            page: data.number ?? page,
            hasMore: data.last === false,
        };
    } catch (err) {
        console.error(`[fetchRootComments] Error fetching paginated comments, falling back:`, err);
        return fetchRootCommentsFallback(postId, page, size);
    }
}

/** Fallback: dùng legacy list endpoint, phân trang client-side. */
async function fetchRootCommentsFallback(
    postId: string,
    page: number,
    size: number,
): Promise<CommentPage> {
    try {
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/posts/${postId}/comments`, {
            signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) {
            console.error(`[fetchRootCommentsFallback] Legacy endpoint also failed: ${res.status}`);
            return { comments: [], totalElements: 0, totalPages: 0, page, hasMore: false };
        }
        const raw = await res.json();
        // Legacy endpoint returns either a plain array or a Spring Page (if someone changed it)
        let allComments: ApiComment[];
        if (Array.isArray(raw)) {
            allComments = raw;
        } else if (raw.content && Array.isArray(raw.content)) {
            allComments = raw.content;
        } else if (raw.value && Array.isArray(raw.value)) {
            allComments = raw.value;
        } else {
            allComments = [];
        }
        console.debug(`[fetchRootCommentsFallback] Got ${allComments.length} total comments from legacy endpoint`);
        const roots = allComments
            .filter((c) => !c.deleted && (c.parentCommentId === null || c.parentCommentId === undefined))
            .map(mapComment);
        const start = page * size;
        const slice = roots.slice(start, start + size);
        return {
            comments: slice,
            totalElements: roots.length,
            totalPages: Math.ceil(roots.length / size) || 1,
            page,
            hasMore: start + size < roots.length,
        };
    } catch (err) {
        console.error(`[fetchRootCommentsFallback] Exception:`, err);
        return { comments: [], totalElements: 0, totalPages: 0, page, hasMore: false };
    }
}

/**
 * Lấy replies của một comment cha theo trang.
 * Mặc định: page=0, size=10.
 */
export async function fetchReplies(
    commentId: string,
    page = 0,
    size = 10,
): Promise<CommentPage> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/posts/comments/${commentId}/replies?page=${page}&size=${size}&sort=createdAt,asc`,
            { signal: AbortSignal.timeout(8_000) },
        );
        if (!res.ok) return { comments: [], totalElements: 0, totalPages: 0, page, hasMore: false };
        const data: SpringPage<ApiComment> = await res.json();
        const content: ApiComment[] = Array.isArray(data.content) ? data.content : [];
        return {
            comments: content.filter((c) => !c.deleted).map(mapComment),
            totalElements: data.totalElements ?? 0,
            totalPages: data.totalPages ?? 1,
            page: data.number ?? page,
            hasMore: data.last === false,
        };
    } catch {
        return { comments: [], totalElements: 0, totalPages: 0, page, hasMore: false };
    }
}

/**
 * Lấy danh sách comments của bài post (legacy – dùng cho tương thích ngược).
 */
export async function fetchComments(postId: string): Promise<Comment[]> {
    try {
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/posts/${postId}/comments`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return [];
        const raw = await res.json();
        const list: ApiComment[] = Array.isArray(raw) ? raw : (raw.value ?? []);
        return list.filter((c) => !c.deleted).map(mapComment);
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
        const res = await authFetch(url.toString(), {
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
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/posts/${postId}/comments/${commentId}`,
            { method: "DELETE", signal: AbortSignal.timeout(5_000) },
        );
        return res.ok || res.status === 404;
    } catch {
        return false;
    }
}
