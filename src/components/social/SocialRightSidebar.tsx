import React from "react";
import SocialRightContent from "./sidebar/SocialRightContent";

interface Props {
  currentUserId: string;
}

const SocialRightSidebar: React.FC<Props> = ({ currentUserId }) => {
  return (
    <aside className="w-80 shrink-0 hidden lg:block">
      <div className="sticky top-4">
        <SocialRightContent currentUserId={currentUserId} />
      </div>
    </aside>
  );
};

export default SocialRightSidebar;
