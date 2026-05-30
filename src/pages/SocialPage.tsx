import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SocialFeed from "./social/SocialFeed";
import SocialProfile from "./social/SocialProfile";
import SavedFeed from "./social/SavedFeed";
import HistoryFeed from "./social/HistoryFeed";
import SocialSearch from "./social/SocialSearch";
import StandalonePostView from "./social/StandalonePostView";
import StandaloneStoryView from "./social/StandaloneStoryView";

/**
 * SocialPage - Component chính cho trang xã hội
 * Quản lý routing cho các sub-routes: feed, profile, saved, history, post, story
 */
const SocialPage: React.FC = () => {
  return (
    <Routes>
      {/* Trang chủ - Feed */}
      <Route index element={<SocialFeed />} />

      {/* Tìm kiếm - Search */}
      <Route path="search" element={<SocialSearch />} />

      {/* Trang cá nhân - Profile */}
      <Route path="profile/:userId" element={<SocialProfile />} />

      {/* Chi tiết bài viết - Post */}
      <Route path="post/:postId" element={<StandalonePostView />} />

      {/* Chi tiết story - Story */}
      <Route path="story/:storyId" element={<StandaloneStoryView />} />

      {/* Trang đã lưu - Saved */}
      <Route path="saved" element={<SavedFeed />} />

      {/* Lịch sử xem - History */}
      <Route path="history" element={<HistoryFeed />} />

      {/* Trang cá nhân mặc định - Redirect đến feed */}
      <Route path="profile" element={<Navigate to="/social" replace />} />

      {/* Catch all - Redirect về feed */}
      <Route path="*" element={<Navigate to="/social" replace />} />
    </Routes>
  );
};

export default SocialPage;
