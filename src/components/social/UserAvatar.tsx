import React from "react";
import type { PostUser } from "./types";

interface Props {
  user: PostUser;
  size?: string;
}

const UserAvatar: React.FC<Props> = ({ user, size = "size-10" }) => {
  if (!user) {
    return (
      <div className={`${size} rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-sm shrink-0`}>
        ?
      </div>
    );
  }

  return user.avatar ? (
    <img
      src={user.avatar}
      alt={user.name}
      className={`${size} rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${size} rounded-full ${user.color || "bg-primary-500"} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
      {(user.name || "?").split(" ").pop()?.charAt(0) ?? "?"}
    </div>
  );
};

export default UserAvatar;
