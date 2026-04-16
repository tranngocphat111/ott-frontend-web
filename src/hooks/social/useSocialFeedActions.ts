import { useCallback } from "react";

import {
    createPost,
    deletePost,
    toggleLike,
    updatePost,
} from "../../services/post.service";
import type { Post, User } from "../../components/social/types";
import type { UploadedMedia } from "../../components/social/create-post";


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
            setPosts((prev) => prev.filter((p) => p.id !== id));
            await deletePost(id);
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
            let previousPost: Post | null = null;
            setPosts((prev) =>
                prev.map((p) => {
                    if (p.id !== postId) return p;
                    previousPost = p;
                    return {
                        ...p,
                        content,
                        visibility,
                        media: media.map((m) => ({
                            type: m.type,
                            url: m.url,
                            caption: m.caption ?? null,
                        })),
                        accessControls,
                        time: "Vừa xong",
                    };
                }),
            );

            const result = await updatePost(
                postId,
                currentUser.id,
                content,
                visibility,
                media,
                accessControls,
            );
            if (result.post) {
                setPosts((prev) =>
                    prev.map((p) => (p.id === postId ? result.post! : p)),
                );
                return { ok: true };
            }

            if (previousPost) {
                setPosts((prev) =>
                    prev.map((p) => (p.id === postId ? previousPost! : p)),
                );
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
            const tempId = `temp-${Date.now()}`;
            const optimisticPost: Post = {
                id: tempId,
                author: currentUser,
                time: "Vừa xong",
                content,
                media: media.map((m) => ({ type: m.type, url: m.url })),
                likes: 0,
                comments: 0,
                shares: 0,
                visibility,
                relationship: "self",
            };
            setPosts((prev) => [optimisticPost, ...prev]);

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
                setPosts((prev) =>
                    prev.map((p) => (p.id === tempId ? result.post! : p)),
                );
                return { ok: true };
            }

            setPosts((prev) => prev.filter((p) => p.id !== tempId));
            return { ok: false, error: result.error };
        },
        [currentUser, setPosts],
    );

    return { toggleLikePost, handleDeletePost, handleNewPost, handleUpdatePost };
};
