import type { User } from "../components/social/types";
import type { UserProfile } from "../services/social.service";

export const AVATAR_COLORS = [
    "bg-primary-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-violet-500",
    "bg-sky-500",
] as const;

export const DEFAULT_USER: User = {
    id: "",
    name: "Người dùng",
    displayName: "Người dùng",
    color: "bg-primary-500",
};

export const DEFAULT_PROFILE: UserProfile = {
    bio: "",
    work: "",
    location: "",
    relationship: "",
};
