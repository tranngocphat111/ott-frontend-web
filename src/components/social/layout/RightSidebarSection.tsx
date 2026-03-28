import React from "react";

interface Props {
  children: React.ReactNode;
}

const RightSidebarSection: React.FC<Props> = ({ children }) => (
  <aside className="shrink-0">{children}</aside>
);

export default RightSidebarSection;
