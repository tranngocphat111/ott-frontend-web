import React from "react";
import { Link, useNavigate } from "react-router-dom";

interface Props {
  content?: string | null;
  className?: string;
}

export default function TextTagRenderer({ content, className }: Props) {
  if (!content) return null;
  return (
    <span className={className} style={{ whiteSpace: "pre-wrap" }}>
      {content}
    </span>
  );
}
