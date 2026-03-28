import React from "react";

interface Props {
  children: React.ReactNode;
}

const CenterFeedSection: React.FC<Props> = ({ children }) => (
  <section className="flex-1 min-w-0">
    <div className="max-w-150 mx-auto w-full space-y-4">{children}</div>
  </section>
);

export default CenterFeedSection;
