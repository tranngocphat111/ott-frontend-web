import { useState, useRef } from "react";

import { DEFAULT_USER } from "../constants/social.constants";
import type { Post, User } from "../components/social/types";
import { useSocialFeedModal } from "./social/useSocialFeedModal";
import { useSocialFeedBootstrap } from "./social/useSocialFeedBootstrap";
import { useSocialFeedPagination } from "./social/useSocialFeedPagination";
import { useSocialFeedActions } from "./social/useSocialFeedActions";

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

    const { toggleLikePost, handleDeletePost, handleNewPost, handleUpdatePost } =
        useSocialFeedActions({
            currentUser,
            setPosts,
            setUserReactionMap,
        });

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
        containerRef,
        openModal,
        closeModal,
        toggleLikePost,
        handleDeletePost,
        handleNewPost,
        handleUpdatePost,
    };
};
