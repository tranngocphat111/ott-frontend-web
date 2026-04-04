/**
 * social.service.ts
 * Các thao tác liên quan đến User (account).
 * Bài post → xem post.service.ts
 */

import { API_MEDIA_SERVER_URL } from "../config/api.config";

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
}

/* ─── Public API ──────────────────────────────────────── */

/**
 * Fetch tất cả users từ DB.
 * Trả về mảng rỗng nếu backend không khả dụng.
 */
export async function fetchUsers(): Promise<ApiUser[]> {
    try {
        const res = await fetch(`${API_MEDIA_SERVER_URL}/users`, {
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
        const res = await fetch(
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
        const res = await fetch(`${API_MEDIA_SERVER_URL}/users/${id}`, {
            signal: AbortSignal.timeout(5_000),
        });
        if (!res.ok) return null;
        return (await res.json()) as ApiUser;
    } catch {
        return null;
    }
}

/** Profile bio fields stored/updated on the client (extend when backend supports it). */
export interface UserProfile {
    bio: string;
    work: string;
    location: string;
    relationship: string;
}

/**
 * Upload avatar via multipart PATCH /users/{id}/avatar.
 * Falls back silently if the backend endpoint is not yet available.
 * Returns the new avatarUrl or null.
 */
export async function uploadUserAvatar(
    userId: string,
    file: File,
): Promise<string | null> {
    try {
        const form = new FormData();
        form.append("avatar", file);
        const res = await fetch(`${API_MEDIA_SERVER_URL}/users/${userId}/avatar`, {
            method: "PATCH",
            body: form,
            signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return (json as { avatarUrl?: string }).avatarUrl ?? null;
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
    try {
        const form = new FormData();
        form.append("cover", file);
        const res = await fetch(`${API_MEDIA_SERVER_URL}/users/${userId}/cover`, {
            method: "PATCH",
            body: form,
            signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) return null;
        const json = await res.json();
        return (json as { coverUrl?: string }).coverUrl ?? null;
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
): Promise<ApiUser> {
    const body = {
        bio: fields.bio,
        work: fields.work,
        location: fields.location,
        relationshipStatus: fields.relationship,
    };
    const res = await fetch(`${API_MEDIA_SERVER_URL}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Lưu thất bại (${res.status}): ${text}`);
    }
    return (await res.json()) as ApiUser;
}
