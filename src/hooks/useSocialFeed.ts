import { useEffect, useState, useRef } from "react";

import { DEFAULT_USER } from "../constants/social.constants";
import type { Post, User } from "../components/social/types";
import { useSocialFeedModal } from "./social/useSocialFeedModal";
import { useSocialFeedBootstrap } from "./social/useSocialFeedBootstrap";
import { useSocialFeedPagination } from "./social/useSocialFeedPagination";
import { useSocialFeedActions } from "./social/useSocialFeedActions";
import { mediaSocketService } from "../services";
import { fetchPostById } from "../services/post.service";
import type { MediaRealtimePayload } from "../services/mediaSocket.service";

export const useSocialFeed = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
    const [userReactionMap, setUserReactionMap] = useState<
        Record<string, string>
    >({});
    const [postReactionCountsMap, setPostReactionCountsMap] = useState<
        Record<string, Record<string, number>>
    >({});
    const [loadingDB, setLoadingDB] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const pageRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentUserRef = useRef<User>(DEFAULT_USER);

    const { isModalOpen, openWithFeeling, openModal, closeModal } =
        useSocialFeedModal();

    useSocialFeedBootstrap({
        setPosts,
        setCurrentUser,
        setUserReactionMap,
        setPostReactionCountsMap,
        setHasMore,
        setLoadingDB,
        setLoadError,
        pageRef,
        currentUserRef,
    });

    useSocialFeedPagination({
        loadingMore,
        hasMore,
        setLoadingMore,
        setHasMore,
        setPosts,
        setPostReactionCountsMap,
        pageRef,
        currentUserRef,
        containerRef,
    });

    const { toggleLikePost, handleDeletePost, handleNewPost, handleUpdatePost, handleSharePost } =
        useSocialFeedActions({
            currentUser,
            setPosts,
            setUserReactionMap,
        });

    useEffect(() => {
        if (!currentUser.id) {
            mediaSocketService.disconnect();
            return;
        }

        mediaSocketService.connect();

        const handleMediaUpdate = async (payload: MediaRealtimePayload) => {
            if (!payload?.contentId || payload.contentTargetType !== "POST") {
                return;
            }

            if (payload.operation === "DELETE") {
                setPosts((prev) => prev.filter((p) => p.id !== payload.contentId));
                return;
            }

            const post = await fetchPostById(payload.contentId, currentUser.id);
            if (!post) return;
            setPosts((prev) => {
                const exists = prev.some((p) => p.id === post.id);
                if (exists) {
                    return prev.map((p) => (p.id === post.id ? post : p));
                }
                return [post, ...prev];
            });
        };

        mediaSocketService.onMediaUpdate(handleMediaUpdate);
        return () => mediaSocketService.offMediaUpdate(handleMediaUpdate);
    }, [currentUser.id, setPosts]);

    return {
        posts,
        currentUser,
        userReactionMap,
        postReactionCountsMap,
        isModalOpen,
        openWithFeeling,
        loadingDB,
        loadingMore,
        hasMore,
        loadError,
        containerRef,
        openModal,
        closeModal,
        toggleLikePost,
        handleDeletePost,
        handleNewPost,
        handleUpdatePost,
        handleSharePost,
    };
};
