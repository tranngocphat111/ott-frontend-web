import type { ReactionKey } from "../../components/social/post/reactions";
import type { Post } from "../../components/social/types";
import { toggleLike, deletePost } from "../../services/post.service";

export const usePostActions = (
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>,
  setUserReactionMap: React.Dispatch<React.SetStateAction<Record<string, string>>>
) => {
  const handleToggleLike = async (
    postId: string,
    reactionKey: ReactionKey | null,
    currentUserId: string
  ) => {
    if (!currentUserId) return;

    // Optimistic update
    setUserReactionMap((prev) => {
      const next = { ...prev };
      if (reactionKey) next[postId] = reactionKey;
      else delete next[postId];
      return next;
    });

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: reactionKey ? p.likes + 1 : Math.max(0, p.likes - 1) }
          : p
      )
    );

    // API call
    const result = await toggleLike(
      postId,
      currentUserId,
      (reactionKey ?? "LIKE").toUpperCase()
    );

    if (result !== null) {
      setUserReactionMap((prev) => {
        const next = { ...prev };
        if (result.liked && result.reactionType) {
          next[postId] = result.reactionType.toLowerCase();
        } else {
          delete next[postId];
        }
        return next;
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes: result.totalReactions } : p
        )
      );
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await deletePost(postId);
  };

  return {
    handleToggleLike,
    handleDeletePost,
  };
};
