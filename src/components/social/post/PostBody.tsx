import React from "react";
import type { PostMediaItem } from "../types";
import PostMediaGrid from "../PostMediaGrid";

interface Props {
  content?: string;
  media: PostMediaItem[];
}

const PostBody: React.FC<Props> = ({ content, media }) => (
  <>
    {content && (
      <p className="px-4 pb-3 text-gray-800 leading-relaxed">{content}</p>
    )}
    <PostMediaGrid media={media} />
  </>
);

export default PostBody;
