import React, { useState } from "react";
import { useParams } from "react-router-dom";
import type { TabKey } from "../../components/social/ProfileTabs";
import ProfileHeader from "../../components/social/ProfileHeader";
import PostsTab from "../../components/social/PostsTab";
import AboutTab from "../../components/social/AboutTab";
import PhotosTab from "../../components/social/PhotosTab";
import AvatarEditModal from "../../components/social/AvatarEditModal";
import CoverEditModal from "../../components/social/CoverEditModal";
import { useProfileData } from "../../hooks/social/useProfileData";
import { useSocialFeed } from "../../hooks/useSocialFeed";
import { useAvatarUpload } from "../../hooks/social/useAvatarUpload";
import { useCoverUpload } from "../../hooks/social/useCoverUpload";
import { useAboutEdit } from "../../hooks/social/useAboutEdit";
import { usePostActions } from "../../hooks/social/usePostActions";

const SocialProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  /* ── Tabs ─────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<TabKey>("posts");

  /* ── Custom Hooks ─────────────────────────────────── */
  const { currentUser: feedCurrentUser } = useSocialFeed();

  const {
    profileUser,
    currentUser,
    profile,
    setProfile,
    posts,
    setPosts,
    userReactionMap,
    setUserReactionMap,
    postReactionCountsMap,
    loading,
  } = useProfileData(userId, feedCurrentUser);

  const {
    localAvatar,
    avatarModalOpen,
    avatarFile,
    avatarPreview,
    avatarSaving,
    openAvatarModal,
    closeAvatarModal,
    handleAvatarFileChange,
    handleAvatarSave: saveAvatar,
  } = useAvatarUpload();

  const {
    localCover,
    coverModalOpen,
    coverFile,
    coverPreview,
    coverSaving,
    openCoverModal,
    closeCoverModal,
    handleCoverFileChange,
    handleCoverSave: saveCover,
  } = useCoverUpload();

  const {
    editingAbout,
    draftProfile,
    aboutSaving,
    aboutSaveError,
    startEditAbout,
    cancelEditAbout,
    saveAbout: saveAboutProfile,
    updateDraftField,
  } = useAboutEdit(profile);

  const { handleToggleLike: togglePostLike, handleDeletePost } = usePostActions(
    setPosts,
    setUserReactionMap,
  );

  /* ── Computed values ──────────────────────────────── */
  const isOwner = !!currentUser.id && currentUser.id === userId;

  const handleAvatarSave = () => {
    if (userId) saveAvatar(userId);
  };

  const handleCoverSave = () => {
    if (userId) saveCover(userId);
  };

  const saveAbout = () => {
    if (userId) {
      saveAboutProfile(userId, setProfile);
    }
  };

  const handleToggleLike = (postId: string, reactionKey: any) => {
    togglePostLike(postId, reactionKey, currentUser.id);
  };

  /* ── Computed values ──────────────────────────────── */
  const photoUrls = posts.flatMap((p) =>
    (p.media ?? []).filter((m) => m.type === "image").map((m) => m.url),
  );

  const tabs = [
    { key: "posts" as const, label: "Bài viết" },
    { key: "about" as const, label: "Giới thiệu" },
    {
      key: "photos" as const,
      label: `Ảnh${photoUrls.length ? ` (${photoUrls.length})` : ""}`,
    },
  ];

  const displayName =
    profileUser?.displayName ?? profileUser?.username ?? `User ${userId ?? ""}`;

  const shownAvatar = localAvatar ?? profileUser?.avatarUrl;
  const shownCover = localCover ?? profileUser?.coverUrl;

  return (
    <div className="bg-primary-50 w-full h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto pb-10">
        <ProfileHeader
          coverUrl={shownCover}
          avatarUrl={shownAvatar}
          displayName={displayName}
          username={profileUser?.username}
          bio={profile.bio}
          postCount={posts.length}
          isOwner={isOwner}
          onEditCover={openCoverModal}
          onEditAvatar={openAvatarModal}
          currentUser={currentUser}
          userId={userId}
          setActiveTab={setActiveTab}
          startEditAbout={startEditAbout}
          profile={profile}
          tabs={tabs}
          activeTab={activeTab}
        />

        {/* ── Tab content ────────────────────────────── */}
        <div className="px-4 mt-4 space-y-4">
          {/* POSTS tab */}
          {activeTab === "posts" && (
            <PostsTab
              posts={posts}
              userReactionMap={userReactionMap}
              postReactionCountsMap={postReactionCountsMap}
              currentUser={currentUser}
              loading={loading}
              onToggleLike={handleToggleLike}
              onDeletePost={handleDeletePost}
              onEditPost={() => {}}
            />
          )}

          {/* ABOUT tab */}
          {activeTab === "about" && (
            <AboutTab
              profile={profile}
              draftProfile={draftProfile}
              isOwner={isOwner}
              editingAbout={editingAbout}
              aboutSaving={aboutSaving}
              aboutSaveError={aboutSaveError}
              onStartEdit={startEditAbout}
              onCancelEdit={cancelEditAbout}
              onSave={saveAbout}
              onUpdateDraft={updateDraftField}
            />
          )}

          {/* PHOTOS tab */}
          {activeTab === "photos" && (
            <PhotosTab photoUrls={photoUrls} loading={loading} />
          )}
        </div>
      </div>

      {/* Modals */}
      <AvatarEditModal
        isOpen={avatarModalOpen}
        currentAvatar={shownAvatar}
        avatarPreview={avatarPreview}
        avatarSaving={avatarSaving}
        onClose={closeAvatarModal}
        onFileChange={handleAvatarFileChange}
        onSave={handleAvatarSave}
        avatarFile={avatarFile}
      />

      <CoverEditModal
        isOpen={coverModalOpen}
        currentCover={shownCover}
        coverPreview={coverPreview}
        coverSaving={coverSaving}
        onClose={closeCoverModal}
        onFileChange={handleCoverFileChange}
        onSave={handleCoverSave}
        coverFile={coverFile}
      />
    </div>
  );
};

export default SocialProfile;
