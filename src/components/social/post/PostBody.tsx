import React from "react";
import type { PostMediaItem } from "../types";
import PostMediaCarousel from "../PostMediaCarousel";
import PostMediaGrid from "../PostMediaGrid";
import TextTagRenderer from "../../../utils/TextTagRenderer";

interface Props {
  content?: string;
  media: PostMediaItem[];
  totalLikes?: number;
  isInView?: boolean;
  variant?: "grid" | "carousel";
}

const PostBody: React.FC<Props> = ({
  content,
  media,
  totalLikes,
  isInView,
  variant = "grid",
}) => {
  const MediaComponent =
    variant === "carousel" ? PostMediaCarousel : PostMediaGrid;

  return (
    <>
      {content && (
        <div className="px-4 pb-3 text-gray-800 leading-relaxed">
          <TextTagRenderer content={content} />
        </div>
      )}
      <MediaComponent
        media={media}
        totalLikes={totalLikes}
        isInView={isInView}
      />
    </>
  );
};

export default PostBody;
