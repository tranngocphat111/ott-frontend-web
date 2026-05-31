import React from "react";
import { Link, useNavigate } from "react-router-dom";

interface Props {
  content?: string | null;
  className?: string;
}

const MENTION_RE = /@\[(.*?)\]\(([A-Za-z0-9_-]+)\)|@([A-Za-z0-9_.-]+)/g;
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
      const displayName = match[1] || match[3];
      const linkTarget = match[2] || match[3];
      const isBracketFormat = !!match[1];
      
      parts.push(
        <span
          key={`m-${start}`}
          className="cursor-pointer text-primary-600 hover:underline"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isBracketFormat) {
              navigate(`/social/profile/${linkTarget}`);
            } else {
              try {
                const socialService = await import("../services/social.service");
                const user = await socialService.fetchUserByUsername(linkTarget);
                if (user) {
                  navigate(`/social/profile/${user.id}`);
                } else {
                  navigate(`/social/search?q=${encodeURIComponent("@" + linkTarget)}`);
                }
              } catch {
                navigate(`/social/search?q=${encodeURIComponent("@" + linkTarget)}`);
              }
            }
          }}
        >
          {isBracketFormat ? `@${displayName}` : full}
        </span>
      );
    } else if (full.startsWith("#")) {
      const tag = match[4];
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
