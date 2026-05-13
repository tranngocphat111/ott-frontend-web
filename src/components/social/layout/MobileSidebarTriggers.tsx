import React, { useState } from "react";
import { Menu, Users } from "lucide-react";
import Drawer from "../../common/Drawer";
import type { PostUser } from "../types";
import SocialLeftContent from "../sidebar/SocialLeftContent";
import SocialRightContent from "../sidebar/SocialRightContent";

interface Props {
  currentUser: PostUser;
}

const MobileSidebarTriggers: React.FC<Props> = ({ currentUser }) => {
  const [isLeftOpen, setIsLeftOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* Left Trigger Button - Visible below xl */}
        <button
          onClick={() => setIsLeftOpen(true)}
          className="p-3 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition xl:hidden flex items-center justify-center"
          aria-label="Open Navigation">
          <Menu className="size-6" />
        </button>

        {/* Right Trigger Button - Visible below lg */}
        <button
          onClick={() => setIsRightOpen(true)}
          className="p-3 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition lg:hidden flex items-center justify-center"
          aria-label="Open Social">
          <Users className="size-6" />
        </button>
      </div>

      {/* Left Drawer */}
      <Drawer
        isOpen={isLeftOpen}
        onClose={() => setIsLeftOpen(false)}
        title="Menu"
        side="right">
        <SocialLeftContent
          currentUser={currentUser}
          onItemClick={() => setIsLeftOpen(false)}
        />
      </Drawer>

      {/* Right Drawer */}
      <Drawer
        isOpen={isRightOpen}
        onClose={() => setIsRightOpen(false)}
        title="Bạn bè & Yêu cầu"
        side="right">
        <SocialRightContent currentUserId={currentUser.id} />
      </Drawer>
    </>
  );
};

export default MobileSidebarTriggers;
