import React from "react";
import { Link, useNavigate } from "react-router-dom";

interface Props {
  content?: string | null;
  className?: string;
}

const MENTION_RE = /@([A-Za-z0-9_.-]+)/g;
const HASHTAG_RE = /#([A-Za-z0-9_.-]+)/g;

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export default function TextTagRenderer({ content, className }: Props) {
  const navigate = useNavigate();
  if (!content) return null;

  // Split by mentions/hashtags while preserving order
  const parts: React.ReactNode[] = [];
  let idx = 0;
  const combined = new RegExp(`${MENTION_RE.source}|${HASHTAG_RE.source}`, "g");
  let match: RegExpExecArray | null;
  while ((match = combined.exec(content)) !== null) {
    const start = match.index;
    if (start > idx) {
      parts.push(
        <span
          key={`t-${idx}-${start}`}
          className="inline"
          dangerouslySetInnerHTML={{
            __html: escapeHtml(content.substring(idx, start)),
          }}
        />,
      );
    }
    const full = match[0];
    if (full.startsWith("@")) {
      const username = match[1];
      parts.push(
        <Link
          key={`m-${start}`}
          to={`/social/search?q=@${encodeURIComponent(username)}`}
          className="text-primary-600 hover:underline"
          onClick={(e) => {
            // allow link normal behavior
          }}>
          @{username}
        </Link>,
      );
    } else if (full.startsWith("#")) {
      const tag = match[2];
      parts.push(
        <Link
          key={`h-${start}`}
          to={`/social/search?q=%23${encodeURIComponent(tag)}`}
          className="text-primary-600 hover:underline">
          #{tag}
        </Link>,
      );
    }
    idx = combined.lastIndex;
  }

  if (idx < content.length) {
    parts.push(
      <span
        key={`t-end-${idx}`}
        className="inline"
        dangerouslySetInnerHTML={{ __html: escapeHtml(content.substring(idx)) }}
      />,
    );
  }

  return (
    <span className={className} style={{ whiteSpace: "pre-wrap" }}>
      {parts}
    </span>
  );
}
