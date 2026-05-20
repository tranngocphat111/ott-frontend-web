import { useCallback } from "react";

import type { Post, User } from "../../components/social/types";
import type { UploadedMedia } from "../../components/social/create-post";
import { createPost, deletePost, sharePost, toggleLike, updatePost } from "../../services/post.service";


type Params = {
    currentUser: User;
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
    setUserReactionMap: React.Dispatch<
        React.SetStateAction<Record<string, string>>
    >;
};

export const useSocialFeedActions = ({
    currentUser,
    setPosts,
    setUserReactionMap,
}: Params) => {
    const toggleLikePost = useCallback(
        async (id: string, reactionKey: string | null) => {
            if (!currentUser.id) return;
            setUserReactionMap((prev) => {
                const next = { ...prev };
                if (reactionKey) next[id] = reactionKey;
                else delete next[id];
                return next;
            });
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === id ?
                        {
                            ...p,
                            likes: reactionKey ? p.likes + 1 : Math.max(0, p.likes - 1),
                        }
                        : p,
                ),
            );

            const result = await toggleLike(
                id,
                currentUser.id,
                (reactionKey ?? "LIKE").toUpperCase(),
            );
            if (result !== null) {
                setUserReactionMap((prev) => {
                    const next = { ...prev };
                    if (result.liked && result.reactionType) {
                        next[id] = result.reactionType.toLowerCase();
                    } else {
                        delete next[id];
                    }
                    return next;
                });
                setPosts((prev) =>
                    prev.map((p) =>
                        p.id === id ? { ...p, likes: result.totalReactions } : p,
                    ),
                );
            }
        },
        [currentUser.id, setPosts, setUserReactionMap],
    );

    const handleDeletePost = useCallback(
        async (id: string) => {
            // Immediate update
            setPosts((prev) => prev.filter((p) => p.id !== id));
            const success = await deletePost(id);
            if (!success) {
                // If failed, we might want to reload or show an error
                console.error("Xóa bài viết thất bại");
            }
        },
        [setPosts],
    );

    const handleUpdatePost = useCallback(
        async (
            postId: string,
            content: string,
            media: UploadedMedia[],
            visibility: string,
            accessControls?: { accountId: string; ruleType: "INCLUDE" | "EXCLUDE" }[],
        ): Promise<{ ok: boolean; error?: string }> => {
            if (!currentUser.id) {
                return { ok: false, error: "Không tìm thấy tài khoản." };
            }
            const result = await updatePost(
                postId,
                currentUser.id,
                content,
                visibility,
                media,
                accessControls,
            );
            if (result.post) {
                // Patch media URLs with local blob URLs to avoid "S3 upload lag" (broken images)
                const patchedPost = { ...result.post };
                if (patchedPost.media && patchedPost.media.length > 0) {
                    patchedPost.media = patchedPost.media.map((m, idx) => {
                        const local = media[idx];
                        if (local && local.url?.startsWith("blob:")) {
                            return { ...m, url: local.url };
                        }
                        return m;
                    });
                }

                // Immediate update
                setPosts((prev) =>
                    prev.map((p) => (p.id === postId ? patchedPost : p)),
                );
                return { ok: true };
            }

            return { ok: false, error: result.error };
        },
        [currentUser.id, setPosts],
    );

    const handleNewPost = useCallback(
        async (
            content: string,
            media: UploadedMedia[],
            visibility: string,
            accessControls?: { accountId: string; ruleType: "INCLUDE" | "EXCLUDE" }[],
        ): Promise<{ ok: boolean; error?: string }> => {
            if (!currentUser.id) {
                return { ok: false, error: "Không tìm thấy tài khoản." };
            }
            const fileMedia = media.filter((m) => m.file) as Required<UploadedMedia>[];
            const files = fileMedia.map((m) => m.file);
            const captions = fileMedia.map((m) => m.caption ?? "");
            const result = await createPost(
                currentUser.id,
                content,
                visibility,
                files,
                captions,
                accessControls,
            );

            if (result.post) {
                // Patch media URLs with local blob URLs to avoid "S3 upload lag" (broken images)
                const patchedPost = { ...result.post };
                if (patchedPost.media && patchedPost.media.length > 0) {
                    patchedPost.media = patchedPost.media.map((m, idx) => {
                        const local = media[idx];
                        if (local && local.url?.startsWith("blob:")) {
                            return { ...m, url: local.url };
                        }
                        return m;
                    });
                }

                // Immediate update
                setPosts((prev) => [patchedPost, ...prev]);
                return { ok: true };
            }
            return { ok: false, error: result.error };
        },
        [currentUser],
    );

    const handleSharePost = useCallback(
        async (
            postId: string,
            caption?: string,
            visibility: string = "PUBLIC",
        ): Promise<{ ok: boolean; error?: string }> => {
            if (!currentUser.id) {
                return { ok: false, error: "Không tìm thấy tài khoản." };
            }
            const result = await sharePost(
                postId,
                currentUser.id,
                caption,
                visibility,
            );
            if (result.post) {
                setPosts((prev) => [result.post!, ...prev]);
                return { ok: true };
            }
            return { ok: false, error: result.error };
        },
        [currentUser.id, setPosts],
    );

    return { toggleLikePost, handleDeletePost, handleNewPost, handleUpdatePost, handleSharePost };
};
