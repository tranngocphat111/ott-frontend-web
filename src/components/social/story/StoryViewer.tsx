import React, { useState } from "react";
import {
  Maximize,
  MoreHorizontal,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
  X,
  Trash2,
  Eye,
  MessageCircle,
  ThumbsUp,
  Heart,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import avatar from "../../../assets/avatar.png";
import { useAuth } from "../../../contexts/AuthContext";
import CommentSection from "../CommentSection";
import ReactionPicker from "../post/ReactionPicker";
import PostReactionsListModal from "../post/PostReactionsListModal";
import { REACTIONS } from "../post/reactions";
import type { ReactionKey } from "../post/reactions";
import { toggleLike, fetchPostReactions } from "../../../services/post.service";
import { checkIsSaved, toggleSaveContent, recordViewHistory } from "../../../services/social.service";
import { mediaSocketService, type PostActivityPayload } from "../../../services/mediaSocket.service";
import type { StoryItem, StoryUserGroup } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeStory: StoryItem | null;
  storyGroups: StoryUserGroup[];
  selectedUserStoriesLength: number;
  activeStoryIndex: number;
  storyProgress: number;
  isPaused: boolean;
  volume: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onOpenUserStories: (stories: StoryItem[]) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePause: () => void;
  onVolumeChange: (nextVolume: number) => void;
  onEnterFullscreen: () => void;
  onDeleteStory: (storyId: string) => void;
  onEditStory?: (story: StoryItem) => void;
  onShowViewers?: (storyId: string) => void;
  currentUserId: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const StoryViewer: React.FC<Props> = ({
  isOpen,
  onClose,
  activeStory,
  storyGroups,
  selectedUserStoriesLength,
  activeStoryIndex,
  storyProgress,
  isPaused,
  volume,
  canGoPrev,
  canGoNext,
  onOpenUserStories,
  onPrev,
  onNext,
  onTogglePause,
  onVolumeChange,
  onEnterFullscreen,
  onDeleteStory,
  onEditStory,
  onShowViewers,
  currentUserId,
  videoRef,
}) => {
  const [hasVideoAudio, setHasVideoAudio] = useState(true);

  const { user } = useAuth();
  const [sidebarTab, setSidebarTab] = useState<'stories' | 'comments'>('stories');
  const [showMobileComments, setShowMobileComments] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showReactionsList, setShowReactionsList] = useState(false);

  const [reactionMap, setReactionMap] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<ReactionKey | null>(null);
  const [submittingReaction, setSubmittingReaction] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!activeStory) return;
    setShowMobileComments(false);
    
    // Ghi nhận lượt xem
    recordViewHistory(activeStory.id);

    // Kiểm tra trạng thái đã lưu
    checkIsSaved(activeStory.id).then(setIsSaved);

    let cancelled = false;
    const fetchCounts = async () => {
      const counts = await fetchPostReactions(activeStory.id);
      if (!cancelled) setReactionMap(counts);
    };
    void fetchCounts();

    const handleActivity = (payload: PostActivityPayload) => {
      if (payload.postId === activeStory.id && payload.activityType === 'REACTION') {
        void fetchCounts();
      }
    };

    mediaSocketService.onPostActivity(handleActivity);

    return () => { 
      cancelled = true; 
      mediaSocketService.offPostActivity(handleActivity);
    };
  }, [activeStory?.id]);

  const handleLike = async (key: ReactionKey) => {
    if (!activeStory || !user?.id || submittingReaction) return;
    setSubmittingReaction(true);

    const previousReaction = userReaction;
    const isRemoving = previousReaction === key;

    setUserReaction(isRemoving ? null : key);
    setReactionMap(prev => {
      const next = { ...prev };
      if (previousReaction) {
        next[previousReaction.toLowerCase()] = Math.max(0, (next[previousReaction.toLowerCase()] || 1) - 1);
      }
      if (!isRemoving) {
        next[key.toLowerCase()] = (next[key.toLowerCase()] || 0) + 1;
      }
      return next;
    });

    const res = await toggleLike(activeStory.id, user.id, key);
    if (!res) {
      setUserReaction(previousReaction); // revert
    } else {
      setUserReaction(res.liked && res.reactionType ? (res.reactionType as ReactionKey) : null);
    }
    setSubmittingReaction(false);
    setShowPicker(false);
  };

  const handleToggleSave = async () => {
    if (!activeStory) return;
    const newState = !isSaved;
    setIsSaved(newState);
    const success = await toggleSaveContent(activeStory.id, newState);
    if (!success) {
      setIsSaved(!newState); // revert if failed
    }
  };

  const totalReactions = Object.values(reactionMap).reduce((a, b) => a + b, 0);

  if (!isOpen || !activeStory) return null;

  const isOwner = activeStory.userId === currentUserId;
  const hasSound = (activeStory.contentType === "VIDEO" && hasVideoAudio) || (activeStory.musics && activeStory.musics.length > 0);

  return (
    <div className="fixed inset-0 z-[60] bg-[#0c0d0f]">
      <button
        type="button"
        onClick={onClose}
        className="absolute left-5 top-5 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center transition"
      >
        <X className="size-5" />
      </button>

      <div className="h-full w-full flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-[320px] border-r border-white/10 bg-[#0c0d0f] flex-col">
          <div className="flex border-b border-white/10 shrink-0">
            <button
              onClick={() => setSidebarTab('stories')}
              className={`flex-1 py-5 text-sm font-semibold transition text-center ${sidebarTab === 'stories' ? 'text-white border-b-2 border-white' : 'text-white/40 hover:text-white/60'}`}
            >
              Danh sách Story
            </button>
            <button
              onClick={() => setSidebarTab('comments')}
              className={`flex-1 py-5 text-sm font-semibold transition text-center ${sidebarTab === 'comments' ? 'text-white border-b-2 border-white' : 'text-white/40 hover:text-white/60'}`}
            >
              Bình luận
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'stories' ? (
              <div className="p-4 space-y-2">
                {storyGroups.map((group) => (
                  <button
                    key={group.userId}
                    type="button"
                    onClick={() => onOpenUserStories(group.stories)}
                    className="w-full flex items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-white/10 transition"
                  >
                    <img
                      src={group.avatarUrl ?? avatar}
                      alt={group.name}
                      className="size-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-white text-sm font-semibold">{group.name}</div>
                      <div className="text-white/50 text-xs">Story</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full bg-white text-slate-900">
                <CommentSection
                  postId={activeStory.id}
                  currentUser={{
                    id: user?.id || "",
                    name: user?.fullName || "Khách",
                    displayName: user?.fullName || "Khách",
                    avatar: user?.avatarUrl,
                    color: "#3b82f6"
                  }}
                />
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative w-[360px] sm:w-[390px] h-[640px] sm:h-[680px] rounded-[32px] bg-[#a7b4bb] shadow-[0_40px_90px_-45px_rgba(15,23,42,0.9)] overflow-hidden">
            {/* Progress Bars */}
            <div className="absolute top-3 left-4 right-4 z-20">
              <div className="h-1.5 rounded-full bg-white/40 overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{
                    width: `${((activeStoryIndex + storyProgress) / selectedUserStoriesLength) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Header */}
            <div className="absolute top-6 left-5 right-5 z-20 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <img
                  src={activeStory.avatarUrl ?? avatar}
                  alt={activeStory.name}
                  className="size-9 rounded-full border border-white/40 object-cover"
                />
                <div>
                  <div className="text-sm font-semibold">{activeStory.name}</div>
                  <div className="text-xs text-white/60">Story</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasSound && (
                  <div className="relative group">
                    <button
                      type="button"
                      disabled={activeStory.contentType !== "VIDEO" && (!activeStory.musics || activeStory.musics.length === 0)}
                      onClick={() => onVolumeChange(volume === 0 ? 0.6 : 0)}
                      className="size-8 rounded-full bg-black/30 hover:bg-black/50 disabled:opacity-40 inline-flex items-center justify-center"
                    >
                      {volume === 0 ? <VolumeX className="size-4" /> : volume < 0.5 ? <Volume1 className="size-4" /> : <Volume2 className="size-4" />}
                    </button>
                    <div className="absolute right-0 mt-2 w-36 opacity-0 translate-y-1 transition group-hover:opacity-100 group-hover:translate-y-0 z-30">
                      <div className="rounded-full bg-black/60 px-3 py-2">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={volume}
                          onChange={(e) => onVolumeChange(Number(e.target.value))}
                          disabled={activeStory.contentType !== "VIDEO"}
                          className="w-full accent-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onTogglePause}
                  className="size-8 rounded-full bg-black/30 hover:bg-black/50 inline-flex items-center justify-center"
                >
                  {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className="size-8 rounded-full bg-black/30 hover:bg-black/50 inline-flex items-center justify-center transition"
                >
                  {isSaved ? <BookmarkCheck className="size-4 text-primary-400" /> : <Bookmark className="size-4" />}
                </button>
                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditStory?.(activeStory)}
                      className="size-8 rounded-full bg-black/30 hover:bg-black/50 inline-flex items-center justify-center"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Xóa story này?")) {
                          onDeleteStory(activeStory.id);
                        }
                      }}
                      className="size-8 rounded-full bg-red-500/30 hover:bg-red-500/50 text-red-200 inline-flex items-center justify-center transition"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Media Content */}
            <div className="absolute inset-0 flex items-center justify-center px-6 pt-12 pb-10">
              <div className="w-full h-full flex items-center justify-center relative">
                {activeStory.items && activeStory.items.length > 0 ? (
                  activeStory.items
                    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                    .map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="absolute"
                        style={{
                          left: `${item.positionX * 100}%`,
                          top: `${item.positionY * 100}%`,
                          transform: `translate(-50%, -50%) scale(${item.scale}) rotate(${item.rotation}deg)`,
                          zIndex: item.zIndex,
                          width: item.type === "TEXT" ? "auto" : "100%",
                          height: item.type === "TEXT" ? "auto" : "100%",
                        }}
                      >
                        {item.type === "IMAGE" && item.url ? (
                          <img src={item.url} alt="" className="w-full h-full object-contain" />
                        ) : item.type === "VIDEO" && item.url ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-contain"
                            autoPlay
                            muted
                            playsInline
                            loop
                          />
                        ) : item.type === "TEXT" && item.textContent ? (
                          <div
                            className="px-4 py-2 rounded-lg"
                            style={{ backgroundColor: item.textBackgroundColor || "rgba(0,0,0,0.5)" }}
                          >
                            <p className="text-white text-lg font-semibold leading-tight whitespace-pre-wrap break-words">
                              {item.textContent}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ))
                ) : activeStory.contentType === "IMAGE" && activeStory.imageUrl ? (
                  <img src={activeStory.imageUrl} alt={activeStory.name} className="w-full h-full object-contain" />
                ) : activeStory.contentType === "VIDEO" && activeStory.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={activeStory.videoUrl}
                    className="w-full h-full object-contain"
                    autoPlay
                    playsInline
                    controls={false}
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      const hasAudio =
                        (video as any).mozHasAudio ||
                        Boolean((video as any).webkitAudioDecodedByteCount) ||
                        Boolean(video.audioTracks && video.audioTracks.length > 0);
                      setHasVideoAudio(hasAudio !== false);
                    }}
                  />
                ) : activeStory.contentType === "TEXT" && activeStory.textContent ? (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center text-center px-8"
                    style={{ backgroundColor: activeStory.textBackgroundColor || "#111827" }}
                  >
                    <p className="text-white text-2xl font-semibold leading-tight whitespace-pre-wrap break-words">
                      {activeStory.textContent}
                    </p>
                  </div>
                ) : (
                  <>
                    {activeStory.isBirthday && <div className="mb-3 text-3xl">🎂</div>}
                    <h3 className="text-slate-900 text-xl font-bold leading-tight">{activeStory.name}</h3>
                  </>
                )}
              </div>
            </div>

            {/* Navigation Overlays */}
            <button
              type="button"
              aria-label="Previous story"
              disabled={!canGoPrev}
              onClick={onPrev}
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer disabled:cursor-default z-10"
            />
            <button
              type="button"
              aria-label="Next story"
              disabled={!canGoNext}
              onClick={onNext}
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer disabled:cursor-default z-10"
            />

            {/* Bottom Interaction Bar */}
            <div className="absolute bottom-5 left-5 right-5 z-30 flex items-center gap-3 pointer-events-auto">
              <button
                onClick={() => {
                  if (!isPaused) onTogglePause();
                  if (window.innerWidth < 1024) {
                    setShowMobileComments(true);
                  } else {
                    setSidebarTab('comments');
                  }
                }}
                className="flex-1 h-11 rounded-full border border-white/30 bg-black/30 backdrop-blur-md px-4 flex items-center text-white/90 hover:bg-white/20 transition text-[13px] font-medium"
              >
                Gửi bình luận...
              </button>

              <div className="flex items-center gap-1.5 relative"
                onMouseEnter={() => setShowPicker(true)}
                onMouseLeave={() => setShowPicker(false)}>

                {showPicker && (
                  <div className="absolute bottom-full right-0 mb-3 z-40">
                    <ReactionPicker
                      reaction={userReaction}
                      onSelect={(key) => handleLike(key)}
                      onMouseEnter={() => setShowPicker(true)}
                      onMouseLeave={() => setShowPicker(false)}
                    />
                  </div>
                )}

                <button
                  onClick={() => handleLike(userReaction || "LIKE")}
                  className="size-10 rounded-full flex items-center justify-center hover:bg-white/10 transition"
                >
                  {userReaction ? (
                    <span className="text-2xl">{REACTIONS.find(r => r.key === userReaction)?.emoji}</span>
                  ) : (
                    <Heart className="size-6 text-white hover:text-red-500 transition-colors drop-shadow-md" />
                  )}
                </button>

                {totalReactions > 0 && (
                  <button
                    onClick={() => {
                      if (!isPaused) onTogglePause();
                      setShowReactionsList(true);
                    }}
                    className="text-white text-[13px] font-bold hover:underline px-1 drop-shadow-md"
                  >
                    {totalReactions}
                  </button>
                )}
              </div>
            </div>
          </div>

          {activeStory.contentType === "VIDEO" && activeStory.videoUrl && (
            <button
              type="button"
              onClick={onEnterFullscreen}
              className="absolute right-[calc(50%-230px)] bottom-12 size-10 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center transition"
            >
              <Maximize className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Comments Bottom Sheet */}
      {showMobileComments && (
        <div className="fixed inset-0 z-[70] lg:hidden flex flex-col justify-end pointer-events-none">
          <div
            className="absolute inset-0 bg-transparent pointer-events-auto"
            onClick={() => setShowMobileComments(false)}
          />
          <div className="bg-white w-full rounded-t-[2rem] overflow-hidden pointer-events-auto flex flex-col max-h-[75vh] animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Bình luận</h3>
              <button onClick={() => setShowMobileComments(false)} className="size-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
                <X className="size-4 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <CommentSection
                postId={activeStory.id}
                currentUser={{
                  id: user?.id || "",
                  name: user?.fullName || "Khách",
                  displayName: user?.fullName || "Khách",
                  avatar: user?.avatarUrl,
                  color: "#3b82f6"
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reactions Modal */}
      {showReactionsList && (
        <PostReactionsListModal
          isOpen={showReactionsList}
          onClose={() => setShowReactionsList(false)}
          postId={activeStory.id}
        />
      )}
    </div>
  );
};

export default StoryViewer;
