/**
 * social.service.ts
 * Các thao tác liên quan đến User (account).
 * Bài post → xem post.service.ts
 */

import { API_MEDIA_SERVER_URL, API_CHAT_SERVER_URL, API_BASE_URL } from "../config/api.config";
import { authFetch } from "./api/fetchClient";

/* ─── Raw shape trả về từ backend ────────────────────── */
export interface ApiUser {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    coverUrl: string | null;
    /** Các trường profile (có sau khi backend v2 được deploy) */
    bio: string | null;
    work: string | null;
    location: string | null;
    relationshipStatus: string | null;
    phoneNumber: string | null;
}

type ApiEnvelope<T> = { result?: T; message?: string };

type UserServiceProfile = {
    bio?: string | null;
    work?: string | null;
    location?: string | null;
    relationshipStatus?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
};

type PresignedUrlResponse = {
    uploadUrl: string;
    fileUrl: string;
    s3Key: string;
    contentType?: string | null;
};

const unwrapApiResult = <T,>(payload: unknown): T | null => {
    if (!payload || typeof payload !== "object") return null;
    if ("result" in payload) return (payload as ApiEnvelope<T>).result ?? null;
    return payload as T;
};
export interface RelationshipResponse {
    id: string;
    requesterId: string;
    requesterUsername: string;
    requesterAvatarUrl: string;
    receiverId: string;
    receiverUsername: string;
    receiverAvatarUrl: string;
    status: "PENDING" | "ACCEPTED" | "BLOCKED" | "REMOVED";
    type: "FRIEND",
    createAt: Date,
    acceptedAt: Date
}
export interface ApiRelationshipResponse {
    id: string;
    requesterId: string;
    requesterUsername: string;
    requesterDisplayName: string | null;
    requesterAvatarUrl: string | null;
    receiverId: string;
    receiverUsername: string;
    receiverDisplayName: string | null;
    receiverAvatarUrl: string | null;
}

export interface FriendOption {
    id: string;
    name: string;
    avatarUrl?: string;
}

export interface FriendRequestOption {
    id: string;
    userId: string;
    name: string;
    avatarUrl?: string;
}

/* ─── Public API ──────────────────────────────────────── */

/**
 * Fetch tất cả users từ DB.
 * Trả về mảng rỗng nếu backend không khả dụng.
 */
export async function fetchUsers(): Promise<ApiUser[]> {
    try {
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/users`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json : ((json.value ?? []) as ApiUser[]);
    } catch {
        return [];
    }
}

/**
 * Lấy user theo username từ DB.
 * Trả về null nếu không tìm thấy hoặc backend không khả dụng.
 */
export async function fetchUserByUsername(username: string): Promise<ApiUser | null> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/users/username/${username}`,
            { signal: AbortSignal.timeout(5_000) },
        );
        if (!res.ok) return null;
        return (await res.json()) as ApiUser;
    } catch {
        return null;
    }
}

/**
 * Lấy user theo ID từ DB – trả về full profile gồm bio, work, location, relationshipStatus.
 */
export async function fetchUserById(id: string): Promise<ApiUser | null> {
    try {
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/users/${id}`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return null;
        return (await res.json()) as ApiUser;
    } catch {
        return null;
    }
}

export async function fetchFriends(userId: string): Promise<FriendOption[]> {
    try {
        console.log(`fetchFriends called for userId: ${userId}`);
        const url = `${API_CHAT_SERVER_URL}/relationships/${userId}/friends`;
        console.log(`fetchFriends URL: ${url}`);
        const res = await authFetch(url, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) {
            console.error(`fetchFriends failed with status: ${res.status}`);
            return [];
        }
        const raw = (await res.json()) as any[];
        console.log(`fetchFriends raw data:`, raw);
        if (!Array.isArray(raw)) return [];
        const mapped = raw.map((user) => ({
            id: user.user_id || user.userId || user.id,
            name: user.displayName || user.name || user.username || "Người dùng",
            avatarUrl: user.avatar || user.avatarUrl || user.user_avatar || undefined,
        }));
        console.log(`fetchFriends mapped data:`, mapped);
        return mapped;
    } catch (error) {
        console.error("fetchFriends catch error:", error);
        return [];
    }
}

export async function fetchRelationshipOf(
    user1: string,
    user2?: string,
): Promise<RelationshipResponse | null> {
    try {
        const params = new URLSearchParams({ user1 });
        if (user2) params.set("user2", user2);

        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/relationships?${params.toString()}`,
            { signal: AbortSignal.timeout(5_000) },
        );

        if (!res.ok) return null;

        return (await res.json()) as RelationshipResponse;
    } catch {
        return null;
    }
}

/**
 * Lấy trạng thái quan hệ từ chat-service
 */
export async function fetchRelationshipStatusViaChat(
    userId1: string,
    userId2: string,
): Promise<any | null> {
    try {
        const params = new URLSearchParams({ userId1, userId2 });
        const res = await authFetch(
            `${API_CHAT_SERVER_URL}/relationships/status?${params.toString()}`,
            { signal: AbortSignal.timeout(5_000) },
        );
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function cancelRelationship(id: string | null): Promise<boolean> {
    if (!id) return false;
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/relationships/${id}/cancel`,
            { method: "DELETE", signal: AbortSignal.timeout(5_000) },
        );
        if (!res.ok) throw new Error("Không thể xóa lời mời kết bạn");
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

export async function fetchPendingRequests(
    userId: string,
): Promise<FriendRequestOption[]> {
    try {
        const res = await authFetch(`${API_MEDIA_SERVER_URL}/relationships/pending/${userId}`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return [];
        const raw = (await res.json()) as ApiRelationshipResponse[];
        if (!Array.isArray(raw)) return [];
        return raw.map((rel) => ({
            id: rel.id,
            userId: rel.requesterId,
            name: rel.requesterDisplayName || rel.requesterUsername,
            avatarUrl: rel.requesterAvatarUrl ?? undefined,
        }));
    } catch {
        return [];
    }
}

export async function acceptFriendRequest(
    relationshipId: string,
): Promise<boolean> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/relationships/${relationshipId}/accept`,
            { method: "PATCH", signal: AbortSignal.timeout(5_000) },
        );
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Chấp nhận kết bạn qua chat-service
 */
export async function acceptFriendRequestViaChat(
    relationshipId: string,
): Promise<boolean> {
    try {
        const res = await authFetch(
            `${API_CHAT_SERVER_URL}/relationships/accept/${relationshipId}`,
            { method: "POST", signal: AbortSignal.timeout(5_000) },
        );
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Từ chối kết bạn qua chat-service
 */
export async function rejectFriendRequestViaChat(
    relationshipId: string,
): Promise<boolean> {
    try {
        const res = await authFetch(
            `${API_CHAT_SERVER_URL}/relationships/reject/${relationshipId}`,
            { method: "POST", signal: AbortSignal.timeout(5_000) },
        );
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Hủy lời mời kết bạn qua chat-service
 */
export async function cancelFriendRequestViaChat(
    relationshipId: string,
): Promise<boolean> {
    try {
        const res = await authFetch(
            `${API_CHAT_SERVER_URL}/relationships/cancel/${relationshipId}`,
            { method: "POST", signal: AbortSignal.timeout(5_000) },
        );
        return res.ok;
    } catch {
        return false;
    }
}

export async function blockRelationship(
    relationshipId: string,
    blockerId: string,
): Promise<boolean> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/relationships/${relationshipId}/block?blockerId=${blockerId}`,
            { method: "PATCH", signal: AbortSignal.timeout(5_000) },
        );
        return res.ok;
    } catch {
        return false;
    }
}

export async function unfriendRelationship(
    relationshipId: string,
): Promise<boolean> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/relationships/${relationshipId}/unfriend`,
            { method: "DELETE", signal: AbortSignal.timeout(5_000) },
        );
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Hủy kết bạn qua chat-service
 */
export async function unfriendViaChat(
    userId: string,
    friendId: string,
): Promise<boolean> {
    try {
        const res = await authFetch(
            `${API_CHAT_SERVER_URL}/relationships/unfriend`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, friendId }),
                signal: AbortSignal.timeout(5_000)
            },
        );
        return res.ok;
    } catch {
        return false;
    }
}

export async function rejectFriendRequest(
    relationshipId: string,
): Promise<boolean> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/relationships/${relationshipId}/reject`,
            { method: "DELETE", signal: AbortSignal.timeout(5_000) },
        );
        return res.ok;
    } catch {
        return false;
    }
}

export async function sendFriendRequest(
    requesterId: string,
    receiverId?: string,
): Promise<any> {
    try {
        const res = await authFetch(
            `${API_MEDIA_SERVER_URL}/relationships/send?requesterId=${requesterId}&receiverId=${receiverId}`,
            { method: "POST", signal: AbortSignal.timeout(5_000) },
        );
        if (!res.ok) throw new Error("Gửi kết bạn thất bại.")
        return await res.json();
    } catch (error) {
        console.error(error)
        return null;
    }
}

/**
 * Gửi lời mời kết bạn qua chat-service (sẽ sync qua media-service qua RabbitMQ)
 */
export async function sendFriendRequestViaChat(
    requesterId: string,
    receiverId: string,
): Promise<any> {
    try {
        const res = await authFetch(
            `${API_CHAT_SERVER_URL}/relationships/send`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requesterId, receiverId }),
                signal: AbortSignal.timeout(5_000)
            },
        );
        if (!res.ok) throw new Error("Gửi kết bạn qua Chat thất bại.")
        return await res.json();
    } catch (error) {
        console.error(error)
        return null;
    }
}

/** Profile bio fields stored/updated on the client (extend when backend supports it). */
export interface UserProfile {
    bio: string;
    work: string;
    location: string;
    relationship: string;
    phone: string;
}

export interface UserProfileUpdateResult {
    bio: string | null;
    work: string | null;
    location: string | null;
    relationshipStatus: string | null;
}

const requestPresignedUrl = async (
    filename: string,
    type: "AVATAR" | "COVER",
): Promise<PresignedUrlResponse | null> => {
    const res = await authFetch(
        `${API_BASE_URL}/users/photos/presigned-url?filename=${encodeURIComponent(filename)}&type=${type}`,
        { signal: AbortSignal.timeout(15_000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return unwrapApiResult<PresignedUrlResponse>(json);
};

const uploadToS3 = async (uploadUrl: string, file: File, contentType?: string | null) => {
    const resolvedType = contentType || file.type || "application/octet-stream";
    const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": resolvedType },
        body: file,
    });
    if (!putRes.ok) {
        throw new Error(`Upload failed (${putRes.status})`);
    }
};

const updateUserPhoto = async (
    type: "AVATAR" | "COVER",
    file: File,
): Promise<UserServiceProfile | null> => {
    const presigned = await requestPresignedUrl(file.name, type);
    if (!presigned) return null;

    await uploadToS3(presigned.uploadUrl, file, presigned.contentType);

    const endpoint = type === "AVATAR" ? "avatar" : "cover";
    const res = await authFetch(`${API_BASE_URL}/users/photos/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            fileUrl: presigned.fileUrl,
            s3Key: presigned.s3Key,
            photoType: type,
        }),
        signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return unwrapApiResult<UserServiceProfile>(json);
};

/**
 * Upload avatar via multipart PATCH /users/{id}/avatar.
 * Falls back silently if the backend endpoint is not yet available.
 * Returns the new avatarUrl or null.
 */
export async function uploadUserAvatar(
    userId: string,
    file: File,
): Promise<string | null> {
    if (!userId) return null;
    try {
        const profile = await updateUserPhoto("AVATAR", file);
        return profile?.avatarUrl ?? null;
    } catch {
        return null;
    }
}

/**
 * Upload ảnh bìa via multipart PATCH /users/{id}/cover.
 * Falls back silently if the backend endpoint is not yet available.
 * Returns the new coverUrl or null.
 */
export async function uploadUserCover(
    userId: string,
    file: File,
): Promise<string | null> {
    if (!userId) return null;
    try {
        const profile = await updateUserPhoto("COVER", file);
        return profile?.coverUrl ?? null;
    } catch {
        return null;
    }
}

/**
 * Update user profile fields via PATCH /users/{id}.
 * Maps frontend { relationship } → backend { relationshipStatus }.
 * Returns updated ApiUser on success, throws Error with message on failure.
 */
export async function updateUserProfile(
    userId: string,
    fields: UserProfile,
): Promise<UserProfileUpdateResult> {
    if (!userId) {
        throw new Error("Thiếu userId");
    }

    const body = {
        bio: fields.bio,
        work: fields.work,
        location: fields.location,
        relationshipStatus: fields.relationship,
        phoneNumber: fields.phone,
    };

    const res = await authFetch(`${API_BASE_URL}/users/profile/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Lưu thất bại (${res.status}): ${text}`);
    }

    const json = await res.json();
    const result = unwrapApiResult<UserServiceProfile>(json);

    return {
        bio: result?.bio ?? null,
        work: result?.work ?? null,
        location: result?.location ?? null,
        relationshipStatus: result?.relationshipStatus ?? null,
    };
}
