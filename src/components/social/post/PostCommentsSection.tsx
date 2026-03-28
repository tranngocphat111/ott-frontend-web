import React from "react";
import type { PostUser } from "../types";
import CommentSection from "../CommentSection";

interface Props {
  postId: string;
  currentUser: PostUser;
  onCountChange: (delta: number) => void;
}

const PostCommentsSection: React.FC<Props> = ({
  postId,
  currentUser,
  onCountChange,
}) => (
  <CommentSection
    postId={postId}
    currentUser={currentUser}
    onCountChange={onCountChange}
  />
);

export default PostCommentsSection;
