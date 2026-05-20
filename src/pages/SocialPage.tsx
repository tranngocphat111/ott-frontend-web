import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SocialFeed from "./social/SocialFeed";
import SocialProfile from "./social/SocialProfile";
import SavedFeed from "./social/SavedFeed";
import HistoryFeed from "./social/HistoryFeed";

/**
 * SocialPage - Component chính cho trang xã hội
 * Quản lý routing cho các sub-routes: feed, profile, saved, history
 */
const SocialPage: React.FC = () => {
  return (
    <Routes>
      {/* Trang chủ - Feed */}
      <Route index element={<SocialFeed />} />

      {/* Trang cá nhân - Profile */}
      <Route path="profile/:userId" element={<SocialProfile />} />

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
