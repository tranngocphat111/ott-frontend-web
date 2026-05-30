import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SocialFeedLayout from "../../components/social/layout/SocialFeedLayout";
import SocialLeftSidebar from "../../components/social/SocialLeftSidebar";
import SocialRightSidebar from "../../components/social/SocialRightSidebar";
import PostCard from "../../components/social/PostCard";
import { useAuth } from "../../contexts/AuthContext";
import { fetchViewHistory, clearViewHistory } from "../../services/social.service";
import { History, Trash2 } from "lucide-react";
import { mapPost } from "../../services/post.service";
import { parseBackendDate } from "../../utils/timeUtils";

const HistoryFeed: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    if (user?.id) {
      setCurrentUser({
        id: user.id,
        name: user.fullName || "User",
        displayName: user.fullName || "User",
        avatar: user.avatarUrl,
        initials: user.fullName ? user.fullName[0] : "U"
      });
    }

    loadHistory();
  }, [isAuthenticated, user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchViewHistory(0, 50);
      setContents(data);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem không?")) return;
    
    const success = await clearViewHistory();
    if (success) {
      setContents([]);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="size-6 text-blue-500" />
              Lịch sử xem
            </h1>
            
            {contents.length > 0 && (
              <button 
                onClick={handleClearHistory}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium transition"
              >
                <Trash2 className="size-4" />
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Khu vực Tìm kiếm AI sau này có thể chèn ở đây */}
          {/* <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4..."> */}

          {loading ? (
            <div className="text-center py-10 text-gray-500">Đang tải lịch sử...</div>
          ) : contents.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-blue-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có lịch sử xem</h3>
              <p className="text-gray-500">Các bài viết và story bạn đã xem sẽ hiển thị ở đây.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contents.map((item, idx) => {
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
                
                return (
                  <div key={item.id || idx} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                      {item.storyItems?.[0]?.mediaUrl && (
                        <img src={item.storyItems[0].mediaUrl} alt="Story" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Story của {item.account?.fullName || 'User'}</div>
                      <div className="text-sm text-gray-500">
                        {(parseBackendDate(item.createdAt) ?? new Date(item.createdAt)).toLocaleString()}
                      </div>
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

export default HistoryFeed;
