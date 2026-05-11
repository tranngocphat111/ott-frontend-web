import React, { useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  ParticipantTile,
  type TrackReferenceOrPlaceholder,
  useRoomContext,
  useParticipantInfo,
  ConnectionQualityIndicator,
  useLocalParticipant,
  useParticipants,
  VideoTrack,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  MonitorUp, Users, Settings, Share2, MessageSquare,
  MoreVertical, UserPlus, X, Search, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ParticipantService, socketService } from "../../services";
import Avatar from "../common/Avatar";
import "@livekit/components-styles";

interface LiveKitGroupCallProps {
  token: string;
  serverUrl: string;
  onLeave: () => void;
  video: boolean;
  name?: string;
  avatar?: string;
  conversationId?: string;
  userId?: string;
}

/**
 * LiveKit Group Call Component - Perfectly Aligned with CallPage 1:1 Design
 */
const LiveKitGroupCall: React.FC<LiveKitGroupCallProps> = ({
  token,
  serverUrl,
  onLeave,
  video,
  name = "Cuộc gọi nhóm",
  avatar = "",
  conversationId,
  userId,
}) => {
  return (
    <div className="h-screen w-screen bg-[#121212] text-white overflow-hidden flex flex-col font-body selection:bg-primary-500/30 relative">
      {/* Background radial gradient like CallPage */}
      <div className="absolute inset-0 z-0 bg-radial from-[#1e1e1e] to-[#0a0a0a] pointer-events-none" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-linear-to-b from-black/40 via-transparent to-black/60" />

      {/* Global CSS Overrides for LiveKit Defaults */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .lk-room-container {
          background-color: transparent !important;
          border: none !important;
        }
        .lk-video-container {
          background-color: transparent !important;
        }
        .lk-participant-tile {
          background-color: rgba(35, 26, 16, 0.4) !important;
          border-radius: 1.5rem !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
          overflow: hidden !important;
        }
      ` }} />

      <LiveKitRoom
        video={video}
        audio={true}
        token={typeof token === "string" ? token.trim() : undefined}
        serverUrl={typeof serverUrl === "string" ? serverUrl.trim() : undefined}
        onDisconnected={onLeave}
        onError={(e) => {
          console.error("LiveKit Room Error:", e);
          alert(`Lỗi kết nối cuộc gọi: ${e.message}`);
          onLeave();
        }}
        className="flex-1 flex flex-col overflow-hidden relative z-10"
      >
        <GroupCallContent
          onLeave={onLeave}
          video={video}
          name={name}
          avatar={avatar}
          conversationId={conversationId}
          userId={userId}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

const GroupCallContent = ({
  onLeave,
  video,
  name,
  avatar,
  conversationId,
  userId
}: {
  onLeave: () => void;
  video: boolean;
  name: string;
  avatar: string;
  conversationId?: string;
  userId?: string;
}) => {
  const participants = useParticipants();
  const participantCount = participants.length;
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  return (
    <div className="flex-1 relative flex flex-col overflow-hidden">
      {/* Header Info - Styled like CallPage top bar */}
      <CallHeader name={name} avatar={avatar} />

      {/* Main Video Grid */}
      <div className="flex-1 p-6 md:p-10 overflow-hidden flex items-center justify-center">
        {participantCount > 0 ? (
          <ConferenceGrid />
        ) : (
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
            <div className="w-12 h-12 border-3 border-primary-700 border-t-primary-300 rounded-full animate-spin" />
            <p className="text-primary-300 font-medium text-sm tracking-widest uppercase">
              Đang chờ kết nối...
            </p>
          </div>
        )}
      </div>

      {/* Bottom Controls - Styled like CallPage bottom bar */}
      <CustomControlBar
        onLeave={onLeave}
        video={video}
        onAddMember={() => setIsAddMemberOpen(true)}
      />

      {/* Add Member Modal */}
      {conversationId && userId && (
        <AddMemberCallModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          conversationId={conversationId}
          currentUserId={userId}
        />
      )}
    </div>
  );
};

const CallHeader = ({ name, avatar }: { name: string; avatar: string }) => {
  const participants = useParticipants();
  const participantCount = participants.length;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="px-8 pt-8 flex items-center justify-between z-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-white/20 bg-primary-700 flex items-center justify-center text-sm font-bold shadow-lg shrink-0">
            {avatar ? (
              <img src={avatar} alt={name} className="h-full w-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>

          {/* CHỈ HIỆN KHI ĐÃ CÓ NGƯỜI: Layout màu tối, chữ xanh neon */}
          {participantCount > 0 && (
            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-inner flex items-center justify-center">
              <span className="text-sm font-bold tracking-wider text-[#00FF7F] drop-shadow-[0_0_8px_rgba(0,255,127,0.6)]">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
          )}
          <h2 className="font-display text-xl drop-shadow-lg text-primary-50">
            {name}
          </h2>
        </div>
        {participantCount <= 1 && (
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 animate-pulse ml-[52px]">
            Đang đổ chuông...
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
          <Share2 size={18} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};

const ConferenceGrid = () => {
  // We want to see all cameras. If someone is sharing screen, we show it too.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="h-full w-full relative">
      <AnimatePresence mode="popLayout">
        <div
          className={`grid gap-6 h-full w-full transition-all duration-700 ${getGridLayoutClass(tracks.length)
            }`}
        >
          {tracks.map((trackRef, index) => {
            const isThirdInThree = tracks.length === 3 && index === 2;
            return (
              <motion.div
                key={`${trackRef.participant.sid}-${trackRef.source}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className={`relative rounded-3xl overflow-hidden bg-primary-900/40 border border-white/5 shadow-2xl group ${isThirdInThree ? "md:col-span-2 md:w-1/2 md:justify-self-center" : ""
                  }`}
              >
                <ParticipantTile
                  trackRef={trackRef}
                  className="h-full w-full !bg-transparent"
                >
                  {trackRef.publication && (
                    <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />
                  )}
                  <CustomParticipantUI trackRef={trackRef} />
                </ParticipantTile>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
};

const CustomParticipantUI = ({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) => {
  const { identity, name } = useParticipantInfo({ participant: trackRef.participant });
  const isSpeaking = trackRef.participant.isSpeaking;

  return (
    <>
      {/* Speaking Indicator Glow like 1:1 design could have */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 border-4 border-[#00FF7F]/40 z-10 pointer-events-none rounded-3xl shadow-[inset_0_0_20px_rgba(0,255,127,0.2)]"
          />
        )}
      </AnimatePresence>

      {/* Name Overlay - Styled like CallPage overlays */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/5 transition-all group-hover:bg-black/60">
        <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? "bg-[#00FF7F] animate-pulse" : "bg-emerald-500"}`} />
        <span className="text-[13px] font-medium text-white/80 truncate max-w-[140px]">
          {name || identity}
          {trackRef.participant.isLocal && " (Bạn)"}
        </span>
      </div>

      {/* Connection Quality */}
      <div className="absolute top-5 right-5 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10">
          <ConnectionQualityIndicator className="!w-4 !h-4" />
        </div>
      </div>

      {/* Mic Status Icon */}
      {!trackRef.participant.isMicrophoneEnabled && (
        <div className="absolute bottom-5 right-5 z-20 bg-red-500/80 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white shadow-lg">
          <MicOff size={16} />
        </div>
      )}

      {/* Avatar Placeholder - Show if video is muted or not yet subscribed */}
      {(!trackRef.publication || trackRef.publication.isMuted || !trackRef.publication.isSubscribed) && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-800/60 backdrop-blur-sm z-0">
          <div className="w-24 h-24 rounded-full bg-primary-700 flex items-center justify-center text-4xl font-bold text-white/30 border border-white/10 shadow-2xl">
            {(name || identity || "U").charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </>
  );
};

const CustomControlBar = ({
  onLeave,
  video,
  onAddMember
}: {
  onLeave: () => void;
  video: boolean;
  onAddMember: () => void;
}) => {
  const { localParticipant } = useLocalParticipant();

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled);
  };

  const toggleCam = async () => {
    await localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
  };

  const toggleScreen = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled);
    } catch (e) {
      console.error(e);
    }
  };

  const isMicOn = localParticipant.isMicrophoneEnabled;
  const isCamOn = localParticipant.isCameraEnabled;
  const isScreenSharing = localParticipant.isScreenShareEnabled;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 px-6 py-4 bg-[#1a1a1a]/80 backdrop-blur-3xl border border-white/5 rounded-3xl flex items-center gap-6 shadow-2xl">
      {/* Mic toggle */}
      <button
        onClick={toggleMic}
        className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${!isMicOn
          ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
          : "bg-white/5 hover:bg-white/10 text-white/80"
          }`}
      >
        {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
      </button>

      {/* Camera toggle */}
      {video && (
        <button
          onClick={toggleCam}
          disabled={isScreenSharing}
          className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${!isCamOn
            ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
            : "bg-white/5 hover:bg-white/10 text-white/80"
            } ${isScreenSharing ? "opacity-20" : ""}`}
        >
          {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
      )}

      {/* End Call - Distinct Red Button like CallPage */}
      <button
        onClick={onLeave}
        className="w-14 h-11 rounded-xl bg-[#A82828] hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-red-500/30 group"
      >
        <PhoneOff size={24} fill="currentColor" stroke="none" />
      </button>

      {/* Screen Share */}
      {video && (
        <button
          onClick={toggleScreen}
          className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${isScreenSharing
            ? "bg-[#00FF7F] text-black shadow-lg shadow-emerald-500/20"
            : "bg-white/5 hover:bg-white/10 text-white/80"
            }`}
        >
          <MonitorUp size={20} />
        </button>
      )}

      {/* Add Member */}
      <button
        onClick={onAddMember}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/80 transition-all"
        title="Thêm thành viên"
      >
        <UserPlus size={20} />
      </button>

      {/* Settings Action */}
      <button className="w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all">
        <Settings size={20} />
      </button>
    </div>
  );
};

// --- ADD MEMBER MODAL COMPONENT ---
interface AddMemberCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentUserId: string;
}

const AddMemberCallModal: React.FC<AddMemberCallModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  currentUserId
}) => {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const participants = useParticipants(); // To filter out people already in call

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await ParticipantService.getConversationMembers(conversationId);
      // Filter out self AND people already in the call
      const inCallUserIds = participants.map(p => p.identity);

      const availableMembers = data.filter((m: any) =>
        m.user_id !== currentUserId && !inCallUserIds.includes(m.user_id)
      );
      setMembers(availableMembers);
    } catch (error) {
      console.error("Lỗi khi tải thành viên:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (userId: string) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleInvite = () => {
    if (selectedIds.length === 0) return;

    socketService.emit("moi_them_thanh_vien_goi", {
      conversationId,
      targetUserIds: selectedIds,
      callerId: currentUserId
    });

    onClose();
  };

  if (!isOpen) return null;

  const filteredMembers = members.filter(m =>
    m.user?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold">Thêm vào cuộc gọi</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="text"
              placeholder="Tìm thành viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[300px] px-2 py-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div
                key={member.user_id}
                onClick={() => toggleSelect(member.user_id)}
                className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors group"
              >
                <div className="relative">
                  <Avatar src={member.user?.avatar} name={member.user?.name} size={40} />
                  {selectedIds.includes(member.user_id) && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#1a1a1a]">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{member.user?.name}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 transition-all ${selectedIds.includes(member.user_id)
                  ? "bg-primary-500 border-primary-500"
                  : "border-white/10 group-hover:border-white/30"
                  }`} />
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-white/40 text-sm">
              Không tìm thấy thành viên mới
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm transition-all"
          >
            Hủy
          </button>
          <button
            disabled={selectedIds.length === 0}
            onClick={handleInvite}
            className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-30 disabled:hover:bg-primary-600 font-bold text-sm transition-all shadow-lg shadow-primary-900/20"
          >
            Mời vào ( {selectedIds.length} )
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const getGridLayoutClass = (count: number) => {
  if (count <= 1) return "grid-cols-1 grid-rows-1";
  if (count === 2) return "grid-cols-1 md:grid-cols-2";
  if (count <= 4) return "grid-cols-2 grid-rows-2";
  if (count <= 6) return "grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2";
  if (count <= 9) return "grid-cols-3 grid-rows-3";
  return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
};

export default LiveKitGroupCall;
