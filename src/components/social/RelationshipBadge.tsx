import React from "react";
import { UserPlus } from "lucide-react";
import type { Post } from "./types";

interface Props {
  relationship?: Post["relationship"];
  label?: string;
}

const RelationshipBadge: React.FC<Props> = ({ relationship, label }) => {
  if (!label || relationship === "self" || relationship === "friend")
    return null;

  return (
    <div className="flex items-center gap-1 px-4 pb-2">
      <span
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
          relationship === "stranger" ?
            "bg-amber-50 text-amber-600"
          : "bg-primary-50 text-primary-600"
        }`}>
        <UserPlus className="size-3" />
        {label}
      </span>
    </div>
  );
};

export default RelationshipBadge;
