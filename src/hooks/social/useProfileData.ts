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
import { fetchRelationshipOf } from "../../services/social.service";
import { relationshipSocketService, type RelationshipRealtimePayload } from "../../services/relationshipSocket.service";

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
    phone: "",
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [userReactionMap, setUserReactionMap] = useState<Record<string, string>>({});
  const [postReactionCountsMap, setPostReactionCountsMap] = useState<
    Record<string, Record<string, number>>
  >({});
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);

      const currentUserId: string | undefined = initialCurrentUser?.id;

      // Load full profile fields and set profile user
      const full = await fetchUserById(userId).catch(() => null);
      let chatUser = null;
      
      try {
        const { UserService } = await import("../../services/user.service");
        chatUser = await UserService.getUserById(userId);
      } catch (e) {
        console.error("Failed to fetch user from chat service", e);
      }

      // Check block status if we have a current user
      let blocked = false;
      if (currentUserId && currentUserId !== userId) {
        const rel = await fetchRelationshipOf(currentUserId, userId).catch(() => null);
        if (rel?.status === "BLOCKED") {
          blocked = true;
          setIsBlocked(true);
        }
      }

      if (full || chatUser) {
        setProfile({
          bio: full?.bio ?? "",
          work: full?.work ?? "",
          location: full?.location ?? "",
          relationship: full?.relationshipStatus ?? "",
          phone: full?.phoneNumber ?? "",
        });
        setProfileUser({
          displayName: full?.displayName || chatUser?.name || full?.username || "",
          username: full?.username || chatUser?.name || "",
          avatarUrl: full?.avatarUrl || chatUser?.avatar || undefined,
          coverUrl: full?.coverUrl ?? undefined,
        });
      }

      // If blocked, we can skip fetching posts and reactions
      if (!blocked) {
        // Load posts
        const userPosts = await fetchPostsByUser(userId, currentUserId).catch(() => []);
        setPosts(userPosts);

        // Load post reactions
        if (userPosts.length > 0) {
          const reactionResults = await Promise.all(
            userPosts.map((p) => fetchPostReactions(p.id).catch(() => ({}))),
          );
          const countsMap: Record<string, Record<string, number>> = {};
          userPosts.forEach((p, i) => {
            countsMap[p.id] = reactionResults[i];
          });
          setPostReactionCountsMap(countsMap);
        }
      }

      // Load user reactions (for current user, safe to fetch)
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

  // Realtime relationship listener to detect blocks
  useEffect(() => {
    if (!userId || !initialCurrentUser?.id) return;
    
    relationshipSocketService.connect();
    relationshipSocketService.joinUserRoom(initialCurrentUser.id);
    const handleRelationshipUpdate = (payload: RelationshipRealtimePayload) => {
      const status = String(payload.status || payload.type).toUpperCase();
      
      // If the block event involves this profile user
      if (status === "BLOCKED" || status === "USER_BLOCKED") {
        const involvesProfileUser = 
          payload.targetUserIds?.includes(userId) || 
          payload.requesterId === userId || 
          payload.receiverId === userId ||
          payload.actorId === userId;
          
        if (involvesProfileUser) {
          setIsBlocked(true);
        }
      }
    };
    
    relationshipSocketService.onRelationshipUpdate(handleRelationshipUpdate);
    return () => relationshipSocketService.offRelationshipUpdate(handleRelationshipUpdate);
  }, [userId, initialCurrentUser?.id]);

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
    isBlocked,
  };
};
