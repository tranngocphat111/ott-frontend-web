import { useCallback, useEffect } from "react";

import {
    fetchPostsWithPage,
    fetchPostReactions,
} from "../../services/post.service";
import type { Post, User } from "../../components/social/types";

type ReactionCountsMap = Record<string, Record<string, number>>;

type Params = {
    loadingMore: boolean;
    hasMore: boolean;
    setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
    setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
    setPostReactionCountsMap: React.Dispatch<
        React.SetStateAction<ReactionCountsMap>
    >;
    pageRef: React.MutableRefObject<number>;
    currentUserRef: React.MutableRefObject<User>;
    containerRef: React.RefObject<HTMLDivElement | null>;
};

export const useSocialFeedPagination = ({
    loadingMore,
    hasMore,
    setLoadingMore,
    setHasMore,
    setPosts,
    setPostReactionCountsMap,
    pageRef,
    currentUserRef,
    containerRef,
}: Params) => {
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
    }, [
        currentUserRef,
        hasMore,
        loadingMore,
        pageRef,
        setHasMore,
        setLoadingMore,
        setPostReactionCountsMap,
        setPosts,
    ]);

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
    }, [containerRef, loadNextPage]);
};
