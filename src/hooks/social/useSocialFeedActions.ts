import { useCallback } from "react";

import { createPost, deletePost, toggleLike } from "../../services/post.service";
import type { Post, User } from "../../components/social/types";
import type { UploadedMedia } from "../../components/social/CreatePostModal";

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

    const handleNewPost = useCallback(
        async (content: string, media: UploadedMedia[], visibility: string) => {
            if (!currentUser.id) return;
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

            const files = media.map((m) => m.file);
            const captions = media.map((m) => m.caption ?? "");
            const saved = await createPost(
                currentUser.id,
                content,
                visibility,
                files,
                captions,
            );

            if (saved) {
                setPosts((prev) => prev.map((p) => (p.id === tempId ? saved : p)));
            }
        },
        [currentUser, setPosts],
    );

    return { toggleLikePost, handleDeletePost, handleNewPost };
};
