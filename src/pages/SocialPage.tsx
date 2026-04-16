import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SocialFeed from "./social/SocialFeed";
import SocialProfile from "./social/SocialProfile";
import SocialDemoLogin from "./social/SocialDemoLogin";

/**
 * SocialPage - Component chính cho trang xã hội
 * Quản lý routing cho các sub-routes: feed, profile
 */
const SocialPage: React.FC = () => {
  return (
    <Routes>
      {/* Trang chủ - Feed */}
      <Route index element={<SocialFeed />} />

      {/* Demo login */}
      <Route path="demo-login" element={<SocialDemoLogin />} />

      {/* Trang cá nhân - Profile */}
      <Route path="profile/:userId" element={<SocialProfile />} />

      {/* Trang cá nhân mặc định - Redirect đến feed */}
      <Route path="profile" element={<Navigate to="/social" replace />} />

      {/* Catch all - Redirect về feed */}
      <Route path="*" element={<Navigate to="/social" replace />} />
    </Routes>
  );
};

export default SocialPage;
