import React from "react";
import type { PostUser } from "./types";
import SocialLeftContent from "./sidebar/SocialLeftContent";

interface Props {
  currentUser: PostUser;
}

const SocialLeftSidebar: React.FC<Props> = ({ currentUser }) => {
  return (
    <aside className="w-72 shrink-0 hidden xl:block">
      <div className="sticky top-4">
        <SocialLeftContent currentUser={currentUser} />
      </div>
    </aside>
  );
};

export default SocialLeftSidebar;
