import { useState, useEffect } from "react";
import type { Post, PostUser } from "../../components/social/types";
import type { UserProfile } from "../../services/social.service";
import {
  fetchUserById,
} from "../../services/social.service";
import {
  fetchPostsByUser,
  fetchUserReactions,
  fetchPostReactions,
} from "../../services/post.service";

interface ProfileUser {
  displayName: string;
  username: string;
  avatarUrl?: string;
  coverUrl?: string;
}

export const useProfileData = (
  userId: string | undefined,
  initialCurrentUser?: PostUser
) => {
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const currentUser = initialCurrentUser ?? {
    id: "",
    name: "Người dùng",
    displayName: "Người dùng",
    color: "bg-primary-500",
  };
  const [profile, setProfile] = useState<UserProfile>({
    bio: "",
    work: "",
    location: "",
    relationship: "",
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [userReactionMap, setUserReactionMap] = useState<Record<string, string>>({});
  const [postReactionCountsMap, setPostReactionCountsMap] = useState<
    Record<string, Record<string, number>>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);

      const currentUserId: string | undefined = initialCurrentUser?.id;

      // Load full profile fields and set profile user
      const full = await fetchUserById(userId);
      if (full) {
        setProfile({
          bio: full.bio ?? "",
          work: full.work ?? "",
          location: full.location ?? "",
          relationship: full.relationshipStatus ?? "",
        });
        setProfileUser({
          displayName: full.displayName ?? full.username ?? "",
          username: full.username ?? "",
          avatarUrl: full.avatarUrl ?? undefined,
          coverUrl: full.coverUrl ?? undefined,
        });
      }

      // Load posts
      const userPosts = await fetchPostsByUser(userId, currentUserId);
      setPosts(userPosts);

      // Load post reactions
      if (userPosts.length > 0) {
        const reactionResults = await Promise.all(
          userPosts.map((p) => fetchPostReactions(p.id)),
        );
        const countsMap: Record<string, Record<string, number>> = {};
        userPosts.forEach((p, i) => {
          countsMap[p.id] = reactionResults[i];
        });
        setPostReactionCountsMap(countsMap);
      }

      // Load user reactions
      if (currentUserId) {
        const reactions = await fetchUserReactions(currentUserId);
        const map: Record<string, string> = {};
        for (const r of reactions) {
          if (r.targetType === "POST") {
            map[r.targetId] = r.reactionType.toLowerCase();
          }
        }
        setUserReactionMap(map);
      }

      setLoading(false);
    })();
  }, [userId, initialCurrentUser]);

  return {
    profileUser,
    currentUser,
    profile,
    setProfile,
    posts,
    setPosts,
    userReactionMap,
    setUserReactionMap,
    postReactionCountsMap,
    loading,
  };
};
