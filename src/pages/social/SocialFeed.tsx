import React from "react";

import SocialRightSidebar from "../../components/social/SocialRightSidebar";
import SocialLeftSidebar from "../../components/social/SocialLeftSidebar";
import PostFeed from "../../components/social/PostFeed";
import CreatePostModal from "../../components/social/CreatePostModal";
import SocialFeedLayout from "../../components/social/layout/SocialFeedLayout";
import LeftSidebarSection from "../../components/social/layout/LeftSidebarSection";
import CenterFeedSection from "../../components/social/layout/CenterFeedSection";
import RightSidebarSection from "../../components/social/layout/RightSidebarSection";
import InfiniteScrollIndicator from "../../components/social/feed/InfiniteScrollIndicator";
import EndOfFeedNotice from "../../components/social/feed/EndOfFeedNotice";
import StoryFeed from "../../components/social/feed/StoryFeed";
import CreatePostEntry from "../../components/social/feed/CreatePostEntry";
import { useSocialFeed } from "../../hooks/useSocialFeed";

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
    containerRef,
    openModal,
    closeModal,
    toggleLikePost,
    handleDeletePost,
    handleNewPost,
  } = useSocialFeed();

  return (
    <>
      <SocialFeedLayout containerRef={containerRef}>
        <div className="flex gap-4">
          <LeftSidebarSection>
            <SocialLeftSidebar currentUser={currentUser} />
          </LeftSidebarSection>
          <CenterFeedSection>
            <CreatePostEntry
              currentUser={currentUser}
              onOpenModal={() => openModal(false)}
              onOpenWithFeeling={() => openModal(true)}
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
              onDelete={handleDeletePost}
              currentUser={currentUser}
              loading={loadingDB}
            />
          </CenterFeedSection>
          <RightSidebarSection>
            <SocialRightSidebar />
          </RightSidebarSection>
        </div>
        <InfiniteScrollIndicator isLoading={loadingMore} />
        <EndOfFeedNotice show={!hasMore && !loadingDB && posts.length > 0} />
      </SocialFeedLayout>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onPost={handleNewPost}
        currentUser={currentUser}
        openWithFeeling={openWithFeeling}
      />
    </>
  );
};

export default SocialFeed;
