import React from "react";
import { Camera } from "lucide-react";
import avatar from "../../assets/avatar.png";
import ProfileActions from "./ProfileActions";
import type { PostUser } from "./types";
import ProfileQuickInfo from "./ProfileQuickInfo";
import ProfileTabs, { type TabKey } from "./ProfileTabs";

interface ProfileHeaderProps {
  coverUrl?: string;
  avatarUrl?: string;
  displayName: string;
  username?: string;
  bio?: string;
  postCount: number;
  isOwner: boolean;
  onEditCover: () => void;
  onEditAvatar: () => void;
  currentUser: PostUser;
  userId?: string;
  profile: {
    work?: string;
    location?: string;
    relationship?: string;
  };
  tabs: Array<{ key: TabKey; label: string }>;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  startEditAbout: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  coverUrl,
  avatarUrl,
  displayName,
  username,
  bio,
  postCount,
  isOwner,
  onEditCover,
  onEditAvatar,
  currentUser,
  userId,
  profile,
  tabs,
  activeTab,
  setActiveTab,
  startEditAbout,
}) => {
  return (
    <>
      {/* Cover Photo */}
      <div className="relative h-56 md:h-72 rounded-b-2xl overflow-hidden bg-linear-to-br from-primary-200 via-primary-100 to-primary-500">
        {coverUrl && (
          <img
            src={coverUrl}
            alt="Ảnh bìa"
            className="size-full object-cover"
          />
        )}
        {isOwner && (
          <button
            onClick={onEditCover}
            className="absolute bottom-20 right-4 bg-white px-4 py-2 rounded-lg flex items-center gap-2 text-primary-800 hover:bg-primary-50 transition text-sm font-medium shadow">
            <Camera className="size-4" />
            <span className="hidden md:inline">Chỉnh sửa ảnh bìa</span>
          </button>
        )}
      </div>

      {/* Profile Info Card */}
      <div className="bg-white rounded-2xl mx-4 -mt-16 relative shadow-lg">
        <div className="p-6">
          {/* Avatar and Name */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
            {/* Avatar */}
            <div className="relative -mt-20">
              <div className="size-32 md:size-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center">
                {avatarUrl ?
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="size-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = avatar;
                    }}
                  />
                : <img
                    src={avatar}
                    alt="Profile"
                    className="size-full object-cover"
                  />
                }
              </div>
              {isOwner && (
                <button
                  onClick={onEditAvatar}
                  title="Đổi ảnh đại diện"
                  className="absolute bottom-2 right-2 bg-primary-100 p-2 rounded-full text-primary-700 hover:bg-primary-200 transition shadow">
                  <Camera className="size-4" />
                </button>
              )}
            </div>

            <div className="flex-1 text-center md:text-left mb-4">
              <h1 className="text-3xl font-bold text-gray-800">
                {displayName}
              </h1>
              {bio && (
                <p className="text-gray-500 mt-1 text-sm max-w-sm">{bio}</p>
              )}
              <p className="text-gray-600 mt-1 text-sm">
                <span className="font-medium">{postCount}</span> bài viết
              </p>
            </div>
            <ProfileActions
              isOwner={isOwner}
              currentUserId={currentUser.id}
              profileUserId={userId}
              profileDisplayName={displayName}
              profileAvatarUrl={avatarUrl}
              onEditProfile={() => {
                setActiveTab("about");
                startEditAbout();
              }}
            />
          </div>

          <div className="mt-6 space-y-4">
            <ProfileQuickInfo
              work={profile.work}
              location={profile.location}
              relationship={profile.relationship}
            />
            <ProfileTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileHeader;
