export interface PostMediaItem {
    type: "image" | "video";
    url: string;
    id?: string;
    caption?: string | null;
    likes?: number;
}

export interface User {
    id: string;
    name: string;
    displayName: string;
    avatar?: string;
    color: string;
}

export type PostUser = User;

export interface Post {
    id: string;
    author: User;
    time: string;
    content: string;
    media: PostMediaItem[];
    likes: number;
    comments: number;
    shares: number;
    visibility?: string;
    relationship?: "self" | "friend" | "friend-of-friend" | "stranger";
    relationshipLabel?: string;
    accessControls?: { accountId: string; ruleType: "INCLUDE" | "EXCLUDE" }[];
    sharedPost?: Post;
}

export interface StoryContentItem {
    id?: string;
    type: "TEXT" | "IMAGE" | "VIDEO";
    url?: string;
    textContent?: string;
    textBackgroundColor?: string;
    positionX: number;
    positionY: number;
    width?: number;
    height?: number;
    scale: number;
    rotation: number;
    zIndex: number;
    file?: File;
    localUrl?: string;
}

export interface StoryItem {
    id: string;
    name: string;
    isBirthday: boolean;
    userId?: string;
    avatarUrl?: string;
    contentType?: "TEXT" | "IMAGE" | "VIDEO" | "UNKNOWN";
    textContent?: string;
    textBackgroundColor?: string;
    imageUrl?: string;
    videoUrl?: string;
    totalViews?: number;
    musics?: any[];
    items?: StoryContentItem[];
    expireAt?: string;
    visibility?: string;
    accessControls?: { accountId: string; ruleType: "INCLUDE" | "EXCLUDE" }[];
    lastUpdated?: number;
}

export interface StoryUserGroup {
    userId: string;
    name: string;
    avatarUrl?: string;
    stories: StoryItem[];
}

export interface StorySuggestedUser {
    id: string;
    name: string;
    avatarUrl?: string;
}

export interface StoryReelData {
    storyGroups: StoryUserGroup[];
    suggestedUsers: StorySuggestedUser[];
}

export interface FriendRequest {
    id: string;
    name: string;
    mutualFriends: number;
    time: string;
}
