import React from "react";
import LeftSidebarSection from "./LeftSidebarSection";
import CenterFeedSection from "./CenterFeedSection";
import RightSidebarSection from "./RightSidebarSection";

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
}

const SocialFeedLayout: React.FC<Props> = ({
  containerRef,
  left,
  center,
  right,
  bottom,
}) => (
  <div
    ref={containerRef}
    className="bg-primary-50 w-full h-screen overflow-y-auto">
    <div className="max-w-350 mx-auto px-4 py-4">
      <div className="flex gap-4 relative">
        {left && <LeftSidebarSection>{left}</LeftSidebarSection>}
        {center && <CenterFeedSection>{center}</CenterFeedSection>}
        {right && <RightSidebarSection>{right}</RightSidebarSection>}
      </div>
      {bottom}
    </div>
  </div>
);

export default SocialFeedLayout;
