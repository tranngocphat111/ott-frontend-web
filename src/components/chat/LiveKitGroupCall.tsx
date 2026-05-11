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
  MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "@livekit/components-styles";

interface LiveKitGroupCallProps {
  token: string;
  serverUrl: string;
  onLeave: () => void;
  video: boolean;
}

/**
 * LiveKit Group Call Component - Matches CallPage 1:1 Design
 */
const LiveKitGroupCall: React.FC<LiveKitGroupCallProps> = ({
  token,
  serverUrl,
  onLeave,
  video,
}) => {
  return (
    <div className="h-screen w-screen bg-primary-950 text-white overflow-hidden flex flex-col font-body selection:bg-primary-500/30 relative">
      {/* Background radial gradient like CallPage */}
      <div className="absolute inset-0 z-0 bg-radial from-primary-800 to-primary-950 pointer-events-none" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-linear-to-b from-primary-950/70 via-transparent to-primary-950/80" />

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
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {/* Header Info - Styled like CallPage top bar */}
          <CallHeader />

          {/* Main Video Grid */}
          <div className="flex-1 p-6 md:p-10 overflow-hidden">
            <ConferenceGrid />
          </div>

          {/* Bottom Controls - Styled like CallPage bottom bar */}
          <CustomControlBar onLeave={onLeave} />
        </div>

        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

const CallHeader = () => {
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
    <div className="px-8 pt-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10 shadow-inner flex items-center gap-3">
          <div className="flex items-center gap-2 text-[#00FF7F] drop-shadow-[0_0_8px_rgba(0,255,127,0.4)]">
            <Users size={18} />
            <span className="font-bold tabular-nums">{participantCount}</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <span className="text-sm font-bold tracking-wider text-[#00FF7F] drop-shadow-[0_0_8px_rgba(0,255,127,0.4)]">
            {formatDuration(elapsedSeconds)}
          </span>
        </div>
        <h2 className="font-display text-xl drop-shadow-lg text-primary-50">
          Cuộc gọi nhóm
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
          <Share2 size={18} />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
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
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-3 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 transition-all group-hover:bg-black/70">
        <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-[#00FF7F] animate-pulse" : "bg-emerald-500"}`} />
        <span className="text-sm font-bold text-white/90 truncate max-w-[150px]">
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

const CustomControlBar = ({ onLeave }: { onLeave: () => void }) => {
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
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 px-4 py-3 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-4xl flex items-center gap-4 shadow-2xl">
      {/* Mic toggle */}
      <button
        onClick={toggleMic}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${!isMicOn
          ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
          : "bg-white/10 hover:bg-white/20 text-white"
          }`}
      >
        {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
      </button>

      {/* Camera toggle */}
      <button
        onClick={toggleCam}
        disabled={isScreenSharing}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${!isCamOn
          ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
          : "bg-white/10 hover:bg-white/20 text-white"
          } ${isScreenSharing ? "opacity-20" : ""}`}
      >
        {isCamOn ? <Video size={18} /> : <VideoOff size={18} />}
      </button>

      {/* End Call - Distinct Red Button like CallPage */}
      <button
        onClick={onLeave}
        className="w-12 h-12 rounded-2xl bg-[#A82828] hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-red-500/30 group"
      >
        <PhoneOff size={22} fill="currentColor" stroke="none" className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Screen Share */}
      <button
        onClick={toggleScreen}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${isScreenSharing
          ? "bg-[#00FF7F] text-black shadow-lg shadow-emerald-500/20"
          : "bg-white/10 hover:bg-white/20 text-white"
          }`}
      >
        <MonitorUp size={18} />
      </button>

      {/* More Actions */}
      <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
        <MoreVertical size={18} />
      </button>
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
