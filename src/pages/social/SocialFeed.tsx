import React, { useState } from "react";
import { Link } from "react-router-dom";

import SocialRightSidebar from "../../components/social/SocialRightSidebar";
import SocialLeftSidebar from "../../components/social/SocialLeftSidebar";
import PostFeed from "../../components/social/PostFeed";
import CreatePostModal from "../../components/social/CreatePostModal";
import { ConfirmModal } from "../../components/modal/ConfirmModal";
import SocialFeedLayout from "../../components/social/layout/SocialFeedLayout";
import InfiniteScrollIndicator from "../../components/social/feed/InfiniteScrollIndicator";
import EndOfFeedNotice from "../../components/social/feed/EndOfFeedNotice";
import StoryFeed from "../../components/social/story/StoryFeed";
import CreatePostEntry from "../../components/social/feed/CreatePostEntry";
import { useSocialFeed } from "../../hooks/useSocialFeed";
import { useAuth } from "../../contexts/AuthContext";
import type { Post } from "../../components/social/types";

const SocialFeed: React.FC = () => {
  const {
    posts,
    currentUser,
    userReactionMap,
    postReactionCountsMap,
    isModalOpen,
    openWithFeeling,
    loadingDB,
    loadingMore,
    hasMore,
    loadError,
    containerRef,
    openModal,
    closeModal,
    toggleLikePost,
    handleDeletePost,
    handleNewPost,
    handleUpdatePost,
    handleSharePost,
  } = useSocialFeed();

  const { isAuthenticated, isLoading } = useAuth();

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const openCreateModal = (withFeeling = false) => {
    setEditingPost(null);
    openModal(withFeeling);
  };

  const openEditModal = (post: Post) => {
    closeModal();
    setEditingPost(post);
  };

  const closeEditModal = () => {
    setEditingPost(null);
  };

  console.log(currentUser);

  if (isLoading) {
    return (
      <SocialFeedLayout
        containerRef={containerRef}
        center={
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 text-center max-w-md">
              <h2 className="text-lg font-semibold text-gray-900">
                Dang tai thong tin
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Vui long doi trong giay lat.
              </p>
            </div>
          </div>
        }
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <SocialFeedLayout
        containerRef={containerRef}
        center={
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 text-center max-w-md">
              <h2 className="text-lg font-semibold text-gray-900">
                Can dang nhap
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Hay dang nhap de su dung tinh nang social.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition">
                Dang nhap
              </Link>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <>
      <SocialFeedLayout
        containerRef={containerRef}
        currentUser={currentUser}
        left={<SocialLeftSidebar currentUser={currentUser} />}
        center={
          <>
            <CreatePostEntry
              currentUser={currentUser}
              onOpenModal={() => openCreateModal(false)}
              onOpenWithFeeling={() => openCreateModal(true)}
            />
            <StoryFeed
              currentUserAvatar={currentUser.avatar ?? ""}
              currentUserId={currentUser.id}
              currentUserName={currentUser.displayName ?? currentUser.name}
            />
            <PostFeed
              posts={posts}
              userReactionMap={userReactionMap}
              postReactionCountsMap={postReactionCountsMap}
              onToggleLike={toggleLikePost}
              onDelete={(id) => setDeleteTargetId(id)}
              onEdit={openEditModal}
              onShare={handleSharePost}
              currentUser={currentUser}
              loading={loadingDB}
              loadError={loadError}
            />
          </>
        }
        right={<SocialRightSidebar currentUserId={currentUser.id} />}
        bottom={
          <>
            <InfiniteScrollIndicator isLoading={loadingMore} />
            <EndOfFeedNotice
              show={!hasMore && !loadingDB && posts.length > 0}
            />
          </>
        }
      />

      <CreatePostModal
        key={
          editingPost ? `edit-${editingPost.id}`
          : isModalOpen ?
            `create-${openWithFeeling ? "feeling" : "plain"}`
          : "closed"
        }
        isOpen={isModalOpen || Boolean(editingPost)}
        onClose={editingPost ? closeEditModal : closeModal}
        onPost={handleNewPost}
        onUpdate={handleUpdatePost}
        currentUser={currentUser}
        openWithFeeling={editingPost ? false : openWithFeeling}
        initialPost={
          editingPost ?
            {
              id: editingPost.id,
              content: editingPost.content,
              visibility: editingPost.visibility,
              media: editingPost.media,
              accessControls: editingPost.accessControls,
            }
          : undefined
        }
      />

      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này không?"
        confirmText="Xóa"
        isDangerous
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) {
            await handleDeletePost(deleteTargetId);
          }
          setDeleteTargetId(null);
        }}
      />
    </>
  );
};

export default SocialFeed;
