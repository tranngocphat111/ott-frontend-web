import { useCallback, useEffect, useRef, useState } from "react";
import type { Post, PostUser, StoryItem } from "../social/types";
import type { UploadedMedia } from "../social/CreatePostModal";
import {
    createPost,
    deletePost,
    fetchPostReactions,
    fetchPostsWithPage,
    fetchUserReactions,
    toggleLike,
} from "../../services/post.service";
import { fetchUsers } from "../../services/social.service";
import { AVATAR_COLORS, DEFAULT_POST_USER } from "../../constants/social.constants";

export function useSocialLayoutController() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [currentUser, setCurrentUser] = useState<PostUser>(DEFAULT_POST_USER);
    const [stories, setStories] = useState<StoryItem[]>([]);
    const [userReactionMap, setUserReactionMap] = useState<Record<string, string>>(
        {},
    );
    const [postReactionCountsMap, setPostReactionCountsMap] = useState<
        Record<string, Record<string, number>>
    >({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openWithFeeling, setOpenWithFeeling] = useState(false);

    const [loadingDB, setLoadingDB] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const pageRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentUserRef = useRef<PostUser>(DEFAULT_POST_USER);

    const openModal = useCallback((withFeeling = false) => {
        setOpenWithFeeling(withFeeling);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setOpenWithFeeling(false);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const users = await fetchUsers();
                const me = users[0];

                const dbCurrentUser: PostUser | undefined =
                    me
                        ? {
                            id: me.id,
                            name: me.displayName ?? me.username,
                            avatar: me.avatarUrl ?? undefined,
                            color: AVATAR_COLORS[0],
                        }
                        : undefined;

                if (dbCurrentUser) {
                    setCurrentUser(dbCurrentUser);
                    currentUserRef.current = dbCurrentUser;
                }

                const dbStories: StoryItem[] = users.slice(1, 6).map((u) => ({
                    id: u.id,
                    name: u.displayName ?? u.username,
                    isBirthday: false,
                }));
                setStories(dbStories);

                const result = await fetchPostsWithPage(0, 5, dbCurrentUser?.id ?? "");
                if (result && result.posts.length > 0) {
                    setPosts(result.posts);
                    pageRef.current = 0;
                    setHasMore(result.hasMore);

                    const reactionResults = await Promise.all(
                        result.posts.map((p) => fetchPostReactions(p.id)),
                    );
                    const countsMap: Record<string, Record<string, number>> = {};
                    result.posts.forEach((p, i) => {
                        countsMap[p.id] = reactionResults[i];
                    });
                    setPostReactionCountsMap(countsMap);
                } else {
                    setHasMore(false);
                }

                if (dbCurrentUser?.id) {
                    const reactions = await fetchUserReactions(dbCurrentUser.id);
                    const map: Record<string, string> = {};
                    for (const r of reactions) {
                        if (r.targetType === "POST") {
                            map[r.targetId] = r.reactionType.toLowerCase();
                        }
                    }
                    setUserReactionMap(map);
                }
            } catch {
                // backend không khả dụng → feed trống
            } finally {
                setLoadingDB(false);
            }
        })();
    }, []);

    const loadNextPage = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const nextPage = pageRef.current + 1;
            const result = await fetchPostsWithPage(
                nextPage,
                10,
                currentUserRef.current.id || undefined,
            );
            if (result && result.posts.length > 0) {
                setPosts((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id));
                    const newPosts = result.posts.filter((p) => !existingIds.has(p.id));
                    return [...prev, ...newPosts];
                });
                pageRef.current = nextPage;
                setHasMore(result.hasMore);

                const reactionResults = await Promise.all(
                    result.posts.map((p) => fetchPostReactions(p.id)),
                );
                setPostReactionCountsMap((prev) => {
                    const updated = { ...prev };
                    result.posts.forEach((p, i) => {
                        updated[p.id] = reactionResults[i];
                    });
                    return updated;
                });
            } else {
                setHasMore(false);
            }
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, hasMore]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollHeight - scrollTop - clientHeight < 400) {
                loadNextPage();
            }
        };

        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [loadNextPage]);

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
                    p.id === id
                        ? {
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
                    prev.map((p) => (p.id === id ? { ...p, likes: result.totalReactions } : p)),
                );
            }
        },
        [currentUser.id],
    );

    const handleDeletePost = useCallback(async (id: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        await deletePost(id);
    }, []);

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
        [currentUser],
    );

    return {
        posts,
        currentUser,
        stories,
        userReactionMap,
        postReactionCountsMap,
        isModalOpen,
        openWithFeeling,
        loadingDB,
        loadingMore,
        hasMore,
        containerRef,
        openModal,
        closeModal,
        toggleLikePost,
        handleDeletePost,
        handleNewPost,
    };
}
