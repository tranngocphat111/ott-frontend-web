import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SocialFeedLayout from "../../components/social/layout/SocialFeedLayout";
import SocialLeftSidebar from "../../components/social/SocialLeftSidebar";
import SocialRightSidebar from "../../components/social/SocialRightSidebar";
import PostCard from "../../components/social/PostCard";
import { useAuth } from "../../contexts/AuthContext";
import { fetchSavedContents } from "../../services/social.service";
import { mapPost } from "../../services/post.service";

const SavedFeed: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Convert current user to PostUser format for PostCard
    if (user?.id) {
      setCurrentUser({
        id: user.id,
        name: user.fullName || "User",
        displayName: user.fullName || "User",
        avatar: user.avatarUrl,
        initials: user.fullName ? user.fullName[0] : "U"
      });
    }

    const loadSaved = async () => {
      setLoading(true);
      try {
        const data = await fetchSavedContents(0, 50);
        setContents(data);
      } finally {
        setLoading(false);
      }
    };
    loadSaved();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <SocialFeedLayout
        center={
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 text-center max-w-md">
              <h2 className="text-lg font-semibold text-gray-900">Can dang nhap</h2>
              <Link to="/login" className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-xl bg-primary-500 text-white font-semibold">Dang nhap</Link>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <SocialFeedLayout
      currentUser={currentUser}
      left={<SocialLeftSidebar currentUser={currentUser} />}
      right={<SocialRightSidebar currentUserId={currentUser?.id} />}
      center={
        <div className="py-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Đã lưu</h1>
            <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
              {contents.length} mục
            </span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">Đang tải...</div>
          ) : contents.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có mục nào được lưu</h3>
              <p className="text-gray-500">Khi bạn lưu bài viết hoặc story, chúng sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contents.map((item, idx) => {
                // If it's a post (has caption or status)
                if (item.caption !== undefined) {
                  return (
                    <PostCard
                      key={item.id || idx}
                      post={mapPost(item, 0, currentUser?.id)}
                      currentUser={currentUser}
                      onToggleLike={() => {}}
                    />
                  );
                }
                
                // If it's a story, render a simple card for now
                return (
                  <div key={item.id || idx} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                      {item.storyItems?.[0]?.mediaUrl && (
                        <img src={item.storyItems[0].mediaUrl} alt="Story" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Story của {item.account?.fullName || 'User'}</div>
                      <div className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      }
    />
  );
};

export default SavedFeed;
