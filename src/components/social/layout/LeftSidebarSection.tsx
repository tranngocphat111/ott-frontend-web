import React from "react";

interface Props {
  children: React.ReactNode;
}

const LeftSidebarSection: React.FC<Props> = ({ children }) => (
  <aside className="shrink-0">{children}</aside>
);

export default LeftSidebarSection;
