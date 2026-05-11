import React, { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  ParticipantTile,
  type TrackReference,
  type TrackReferenceOrPlaceholder,
  useRoomContext,
  useParticipantInfo,
} from "@livekit/components-react";
import { Track, RoomEvent, Participant } from "livekit-client";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MonitorUp, Users, Settings, Maximize, Minimize 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "@livekit/components-styles";

interface LiveKitGroupCallProps {
  token: string;
  serverUrl: string;
  onLeave: () => void;
  video: boolean;
}

const LiveKitGroupCall: React.FC<LiveKitGroupCallProps> = ({
  token,
  serverUrl,
  onLeave,
  video,
}) => {
  return (
    <LiveKitRoom
      video={video}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      onDisconnected={onLeave}
      className="h-screen w-screen bg-[#0f172a] text-white overflow-hidden flex flex-col font-sans"
    >
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Header Info */}
        <CallHeader />

        {/* Main Video Grid */}
        <div className="flex-1 p-4 md:p-6 overflow-hidden">
          <ConferenceGrid />
        </div>

        {/* Floating Controls */}
        <CustomControlBar onLeave={onLeave} />
      </div>
      
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
};

const CallHeader = () => {
  const room = useRoomContext();
  const [participantCount, setParticipantCount] = useState(0);

  React.useEffect(() => {
    const updateCount = () => setParticipantCount(room.numParticipants + 1);
    room.on(RoomEvent.ParticipantConnected, updateCount);
    room.on(RoomEvent.ParticipantDisconnected, updateCount);
    updateCount();
    return () => {
      room.off(RoomEvent.ParticipantConnected, updateCount);
      room.off(RoomEvent.ParticipantDisconnected, updateCount);
    };
  }, [room]);

  return (
    <div className="absolute top-6 left-6 z-20 flex items-center gap-4 bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
      <div className="flex items-center gap-2 text-primary-400">
        <Users size={20} />
        <span className="font-bold text-lg">{participantCount}</span>
      </div>
      <div className="h-4 w-px bg-white/20" />
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-widest text-white/50 font-bold">Cuộc gọi nhóm</span>
        <span className="text-sm font-medium text-white/90">Đang diễn ra</span>
      </div>
    </div>
  );
};

const ConferenceGrid = () => {
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
          className={`grid gap-4 h-full w-full transition-all duration-500 ${
            getGridLayoutClass(tracks.length)
          }`}
        >
          {tracks.map((trackRef) => (
            <motion.div
              key={`${trackRef.participant.sid}-${trackRef.source}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative rounded-3xl overflow-hidden bg-slate-800/50 border border-white/5 shadow-2xl group"
            >
              <ParticipantTile 
                trackRef={trackRef}
                className="h-full w-full !bg-transparent"
              >
                <CustomParticipantUI trackRef={trackRef} />
              </ParticipantTile>
            </motion.div>
          ))}
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
      {/* Speaking Indicator Border */}
      {isSpeaking && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 border-4 border-primary-500 z-10 pointer-events-none rounded-3xl shadow-[inset_0_0_20px_rgba(56,189,248,0.5)]"
        />
      )}

      {/* Name Overlay */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/10 transition-all group-hover:bg-black/60">
        <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-primary-400 animate-pulse" : "bg-green-500"}`} />
        <span className="text-sm font-bold text-white/90 truncate max-w-[120px]">
          {name || identity}
        </span>
      </div>

      {/* Connection Quality */}
      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-lg border border-white/10">
          <Settings size={14} className="text-white/60" />
        </div>
      </div>
    </>
  );
};

const CustomControlBar = ({ onLeave }: { onLeave: () => void }) => {
  const room = useRoomContext();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const toggleMic = async () => {
    const enabled = !isMicOn;
    await room.localParticipant.setMicrophoneEnabled(enabled);
    setIsMicOn(enabled);
  };

  const toggleCam = async () => {
    const enabled = !isCamOn;
    await room.localParticipant.setCameraEnabled(enabled);
    setIsCamOn(enabled);
  };

  const toggleScreen = async () => {
    const enabled = !isScreenSharing;
    try {
      await room.localParticipant.setScreenShareEnabled(enabled);
      setIsScreenSharing(enabled);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 px-6 py-4 bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Mic */}
      <ControlButton 
        active={isMicOn} 
        onClick={toggleMic}
        activeIcon={<Mic size={24} />}
        inactiveIcon={<MicOff size={24} />}
        danger={!isMicOn}
      />

      {/* Camera */}
      <ControlButton 
        active={isCamOn} 
        onClick={toggleCam}
        activeIcon={<Video size={24} />}
        inactiveIcon={<VideoOff size={24} />}
        danger={!isCamOn}
      />

      {/* End Call */}
      <button
        onClick={onLeave}
        className="w-14 h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg shadow-red-500/30 hover:scale-110 active:scale-95 group"
      >
        <PhoneOff size={28} fill="currentColor" stroke="none" className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Screen Share */}
      <ControlButton 
        active={isScreenSharing} 
        onClick={toggleScreen}
        activeIcon={<MonitorUp size={24} />}
        inactiveIcon={<MonitorUp size={24} />}
        highlight={isScreenSharing}
      />

      {/* Settings (Placeholder) */}
      <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all">
        <Settings size={22} />
      </button>
    </div>
  );
};

const ControlButton = ({ 
  active, onClick, activeIcon, inactiveIcon, danger, highlight 
}: { 
  active: boolean, onClick: () => void, activeIcon: React.ReactNode, inactiveIcon: React.ReactNode, danger?: boolean, highlight?: boolean 
}) => (
  <button
    onClick={onClick}
    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
      danger && !active
        ? "bg-red-500/20 text-red-500 border border-red-500/50"
        : highlight
          ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
          : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
    } hover:scale-110 active:scale-95`}
  >
    {active ? activeIcon : inactiveIcon}
  </button>
);

const getGridLayoutClass = (count: number) => {
  if (count <= 1) return "grid-cols-1 grid-rows-1";
  if (count === 2) return "grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
  if (count <= 4) return "grid-cols-2 grid-rows-2";
  if (count <= 6) return "grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2";
  return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
};

export default LiveKitGroupCall;
