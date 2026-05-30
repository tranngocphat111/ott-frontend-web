import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPostById } from "../../services/post.service";
import { useAuth } from "../../contexts/AuthContext";
import PostCard from "../../components/social/PostCard";
import type { Post } from "../../components/social/types";
import SocialFeedLayout from "../../components/social/layout/SocialFeedLayout";
import SocialLeftSidebar from "../../components/social/SocialLeftSidebar";
import SocialRightSidebar from "../../components/social/SocialRightSidebar";
import { AlertCircle, ArrowLeft } from "lucide-react";

const StandalonePostView: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse current user for components
  const currentUserObj = user ? {
    id: user.id,
    name: user.name,
    displayName: user.displayName || user.name,
    avatar: user.avatar,
  } : undefined;

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        setError("Không tìm thấy ID bài viết.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const fetchedPost = await fetchPostById(postId, user?.id);
        if (fetchedPost && String(fetchedPost.status).toUpperCase() !== "DELETED") {
          setPost(fetchedPost);
        } else {
          setError("Bài viết này không khả dụng hoặc đã bị xóa.");
        }
      } catch (err) {
        console.error("Error loading post:", err);
        setError("Bài viết này không khả dụng hoặc bạn không có quyền xem.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadPost();
    }
  }, [postId, user?.id, authLoading]);

  if (authLoading) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
        </div>
      );
    }

    if (error || !post) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100 min-h-[50vh]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Bài này không khả dụng</h2>
          <p className="mb-6 max-w-md text-sm text-gray-500">
            Liên kết bạn theo dõi có thể đã bị hỏng, hoặc trang có thể đã bị xóa.
          </p>
          <button
            onClick={() => navigate("/social")}
            className="flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại Bảng tin
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-[680px] mx-auto w-full">
         <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
          <button 
            onClick={() => navigate("/social")}
            className="flex items-center gap-1 hover:text-primary-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Bảng tin
          </button>
          <span>/</span>
          <span>Bài viết của {post.author.displayName}</span>
        </div>
        <PostCard
          post={post}
          currentUser={currentUserObj!}
          onDelete={() => navigate("/social")}
          onEdit={() => {}}
          onShare={() => {}}
        />
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 text-center max-w-md">
          <h2 className="text-lg font-semibold text-gray-900">
            Cần đăng nhập
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Hãy đăng nhập để sử dụng tính năng mạng xã hội.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center justify-center mt-4 px-4 py-2 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <SocialFeedLayout
      currentUser={currentUserObj!}
      left={<SocialLeftSidebar currentUser={currentUserObj!} />}
      center={<div className="py-6">{renderContent()}</div>}
      right={<SocialRightSidebar currentUserId={user.id} />}
    />
  );
};

export default StandalonePostView;
