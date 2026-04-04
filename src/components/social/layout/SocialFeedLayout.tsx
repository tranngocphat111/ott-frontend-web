import React from "react";

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

const SocialFeedLayout: React.FC<Props> = ({ containerRef, children }) => (
  <div
    ref={containerRef}
    className="bg-primary-50 w-full min-h-screen overflow-y-auto">
    <div className="max-w-350 mx-auto px-4 py-4">{children}</div>
  </div>
);

export default SocialFeedLayout;
