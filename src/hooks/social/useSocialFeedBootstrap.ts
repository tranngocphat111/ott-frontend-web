import { useEffect } from "react";

import {
    fetchUserReactions,
    fetchPostReactions,
    findPostsWithAuthorized,
} from "../../services/post.service";
import { fetchUserById } from "../../services/social.service";
import { useAuth } from "../../contexts/AuthContext";
import { AVATAR_COLORS } from "../../constants/social.constants";
import type { Post, User } from "../../components/social/types";

type ReactionCountsMap = Record<string, Record<string, number>>;

type Params = {
    setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
    setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
    setUserReactionMap: React.Dispatch<
        React.SetStateAction<Record<string, string>>
    >;
    setPostReactionCountsMap: React.Dispatch<
        React.SetStateAction<ReactionCountsMap>
    >;
    setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
    setLoadingDB: React.Dispatch<React.SetStateAction<boolean>>;
    pageRef: React.MutableRefObject<number>;
    currentUserRef: React.MutableRefObject<User>;
};

export const useSocialFeedBootstrap = ({
    setPosts,
    setCurrentUser,
    setUserReactionMap,
    setPostReactionCountsMap,
    setHasMore,
    setLoadingDB,
    pageRef,
    currentUserRef,
}: Params) => {
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        (async () => {
            try {
                const authUserId = user?.id?.trim();
                if (!isAuthenticated || !authUserId) {
                    setHasMore(false);
                    return;
                }

                const me = await fetchUserById(authUserId);
                const dbCurrentUser: User | undefined =
                    me ?
                        {
                            id: me.id,
                            name: me.displayName || me.username || "Người dùng",
                            displayName: me.displayName || me.username || "Người dùng",
                            avatar: me.avatarUrl ?? undefined,
                            color: AVATAR_COLORS[0],
                        }
                        : undefined;

                if (dbCurrentUser) {
                    setCurrentUser(dbCurrentUser);
                    currentUserRef.current = dbCurrentUser;
                }

                if (!dbCurrentUser) {
                    setHasMore(false);
                    return;
                }

                const result = await findPostsWithAuthorized(
                    0,
                    5,
                    dbCurrentUser?.id,
                );
                if (result && result.posts.length > 0) {
                    setPosts(result.posts);
                    pageRef.current = 0;
                    setHasMore(result.hasMore);

                    const reactionResults = await Promise.all(
                        result.posts.map((p) => fetchPostReactions(p.id)),
                    );
                    const countsMap: ReactionCountsMap = {};
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
                // backend not available
            } finally {
                setLoadingDB(false);
            }
        })();
    }, [
        isAuthenticated,
        user?.id,
        currentUserRef,
        pageRef,
        setCurrentUser,
        setHasMore,
        setLoadingDB,
        setPostReactionCountsMap,
        setPosts,
        setUserReactionMap,
    ]);
};
