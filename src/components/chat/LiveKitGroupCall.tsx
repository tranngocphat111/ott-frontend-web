import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  isTrackReference,
  type TrackReference,
  type TrackReferenceOrPlaceholder,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { Track, type Participant } from "livekit-client";
import {
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Search,
  UserPlus,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";

import Avatar from "../common/Avatar";
import { ParticipantService } from "../../services/participant.service";
import { socketService } from "../../services/socket.service";
import { getFullUrl } from "../../utils";
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
  callId?: string;
}

interface GroupMember {
  user_id: string;
  status?: string;
  nickname?: string;
  user: {
    name?: string;
    avatar?: string;
  } | null;
}

interface MemberInviteModalProps {
  isOpen: boolean;
  members: GroupMember[];
  activeIdentitySet: Set<string>;
  currentUserId?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onInvite: (userIds: string[]) => void;
}

const MAX_INVITE_SELECTION = 7;
const INITIAL_MEDIA_PENDING_MS = 2500;
const DEVICE_ACTION_TIMEOUT_MS = 5000;
const SCREEN_SHARE_ACTION_TIMEOUT_MS = 60000;

const getMemberName = (member?: GroupMember) =>
  (member?.nickname || "").trim() ||
  (member?.user?.name || "").trim() ||
  "Người dùng";

const getParticipantName = (
  participant: Participant,
  memberById: Map<string, GroupMember>,
  currentUserId?: string,
) => {
  if (String(participant.identity) === String(currentUserId || "")) {
    return "Bạn";
  }

  const memberName = getMemberName(memberById.get(participant.identity));
  if (memberName !== "Người dùng") return memberName;

  return participant.name || `User ${participant.identity.slice(-4)}`;
};

const getParticipantAvatar = (
  participant: Participant,
  memberById: Map<string, GroupMember>,
) => {
  const avatar = memberById.get(participant.identity)?.user?.avatar || "";
  return avatar ? getFullUrl(avatar) : "";
};

const getTrackKey = (trackRef: TrackReferenceOrPlaceholder) =>
  `${trackRef.participant.identity}:${trackRef.source}`;

const hasActiveScreenShare = (participant: Participant) => {
  const screenSharePublication = getSourcePublication(
    participant,
    Track.Source.ScreenShare,
  );

  return Boolean(
    screenSharePublication?.track && !screenSharePublication.isMuted,
  );
};

const formatCallDuration = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const getAvatarInitial = (name: string): string => {
  const normalized = String(name || "").trim();
  return normalized ? normalized.charAt(0).toUpperCase() : "U";
};

const getSourcePublication = (participant: Participant, source: Track.Source) =>
  participant.getTrackPublication(source) ||
  participant
    .getTrackPublications()
    .find((publication) => publication.source === source);

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error("device_action_timeout"));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });

const CallAvatar: React.FC<{
  src?: string;
  name: string;
  sizeClassName: string;
  textClassName: string;
  className?: string;
}> = ({ src, name, sizeClassName, textClassName, className = "" }) => {
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);
  const isBroken = Boolean(src && brokenSrc === src);

  return (
    <div
      className={`${sizeClassName} rounded-full border border-white/20 bg-primary-700 flex items-center justify-center font-display shadow-lg overflow-hidden shrink-0 ${textClassName} ${className}`}
    >
      {src && !isBroken ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setBrokenSrc(src || null)}
        />
      ) : (
        getAvatarInitial(name)
      )}
    </div>
  );
};

const MemberInviteModal: React.FC<MemberInviteModalProps> = ({
  isOpen,
  members,
  activeIdentitySet,
  currentUserId,
  isSubmitting,
  onClose,
  onInvite,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLimitHint, setShowLimitHint] = useState(false);

  const resetSelection = () => {
    setSelectedIds([]);
    setSearchQuery("");
    setShowLimitHint(false);
  };

  const handleClose = () => {
    resetSelection();
    onClose();
  };

  const handleSubmit = () => {
    const targetUserIds = [...selectedIds];
    resetSelection();
    onInvite(targetUserIds);
  };

  const inviteableMembers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return members
      .filter((member) => {
        const userId = String(member.user_id || "");
        const isJoined = !member.status || member.status === "joined";
        return (
          userId &&
          isJoined &&
          userId !== String(currentUserId || "") &&
          !activeIdentitySet.has(userId)
        );
      })
      .filter((member) => {
        if (!normalizedQuery) return true;
        return getMemberName(member).toLowerCase().includes(normalizedQuery);
      });
  }, [activeIdentitySet, currentUserId, members, searchQuery]);

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(userId)) {
        setShowLimitHint(false);
        return prev.filter((id) => id !== userId);
      }

      if (prev.length >= MAX_INVITE_SELECTION) {
        setShowLimitHint(true);
        return prev;
      }

      setShowLimitHint(false);
      return [...prev, userId];
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-[460px] sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary-600">
              <UserPlus size={14} />
              Mời thêm vào cuộc gọi
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Thành viên nhóm
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
            title="Đóng"
          >
            <X size={19} />
          </button>
        </div>

        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setShowLimitHint(false);
              }}
              placeholder="Tìm thành viên để mời..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Đã chọn{" "}
              <span className="font-bold text-primary-700">
                {selectedIds.length}/{MAX_INVITE_SELECTION}
              </span>
            </span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="font-semibold text-primary-700 hover:text-primary-900"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>

          {showLimitHint && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Chỉ có thể mời tối đa {MAX_INVITE_SELECTION} thành viên mỗi lần.
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {inviteableMembers.length > 0 ? (
            <div className="space-y-1">
              {inviteableMembers.map((member) => {
                const userId = String(member.user_id);
                const isSelected = selectedIds.includes(userId);
                const isLimitDisabled =
                  !isSelected && selectedIds.length >= MAX_INVITE_SELECTION;

                return (
                  <button
                    key={userId}
                    type="button"
                    onClick={() => toggleSelect(userId)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-primary-50 text-primary-900"
                        : isLimitDisabled
                          ? "text-slate-400 hover:bg-slate-50"
                          : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Avatar
                      src={getFullUrl(member.user?.avatar || "")}
                      name={getMemberName(member)}
                      size={42}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {getMemberName(member)}
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                        isSelected
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-500">
              <Users size={28} />
              <p className="text-sm font-semibold">
                Không còn thành viên phù hợp để mời
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-white p-4">
          <button
            type="button"
            disabled={selectedIds.length === 0 || isSubmitting}
            onClick={handleSubmit}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 text-sm font-bold text-white shadow-lg shadow-primary-700/20 transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <UserPlus size={18} />
            {isSubmitting ? "Đang gửi lời mời..." : "Mời vào cuộc gọi"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface VideoTileProps {
  trackRef: TrackReferenceOrPlaceholder;
  memberById: Map<string, GroupMember>;
  currentUserId?: string;
  isSelected?: boolean;
  compact?: boolean;
  showInfo?: boolean;
  onClick?: () => void;
}

const VideoTile: React.FC<VideoTileProps> = ({
  trackRef,
  memberById,
  currentUserId,
  isSelected = false,
  compact = false,
  showInfo = true,
  onClick,
}) => {
  const participant = trackRef.participant;
  const displayName = getParticipantName(participant, memberById, currentUserId);
  const avatarSrc = getParticipantAvatar(participant, memberById);
  const screenSharePublication = getSourcePublication(
    participant,
    Track.Source.ScreenShare,
  );
  const isScreenShare = Boolean(
    screenSharePublication?.track && !screenSharePublication.isMuted,
  );
  const cameraPublication = getSourcePublication(participant, Track.Source.Camera);
  const visualPublication =
    (isScreenShare ? screenSharePublication : undefined) ||
    (isTrackReference(trackRef) ? trackRef.publication : undefined) ||
    cameraPublication;
  const microphonePublication = getSourcePublication(
    participant,
    Track.Source.Microphone,
  );
  const visualTrackRef: TrackReference | null = visualPublication
    ? {
        participant,
        publication: visualPublication,
        source: isScreenShare ? Track.Source.ScreenShare : Track.Source.Camera,
      }
    : null;
  const liveVideo = Boolean(
    visualTrackRef &&
      visualTrackRef.publication.track &&
      !visualTrackRef.publication.isMuted,
  );
  const isCameraExplicitlyMuted = Boolean(cameraPublication?.isMuted);
  const isMicrophoneExplicitlyMuted = Boolean(microphonePublication?.isMuted);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative h-full w-full overflow-hidden bg-primary-900 text-left text-white transition-all ${
        compact
          ? "rounded-xl border shadow-xl"
          : "rounded-none border-0"
      } ${
        isSelected
          ? "border-primary-300 shadow-lg shadow-primary-500/20"
          : "border-white/15 hover:border-white/35"
      }`}
      title={onClick ? `Đưa ${displayName} lên màn hình chính` : displayName}
    >
      {liveVideo && visualTrackRef ? (
        <VideoTrack
          trackRef={visualTrackRef}
          className={`h-full w-full object-cover ${
            participant.isLocal && !isScreenShare ? "scale-x-[-1]" : ""
          }`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-radial from-primary-800 to-primary-950">
          <CallAvatar
            src={avatarSrc}
            name={displayName}
            sizeClassName={compact ? "h-10 w-10" : "h-40 w-40 border-4 border-primary-400/30"}
            textClassName={compact ? "text-xs font-bold" : "text-5xl"}
          />
        </div>
      )}

      {showInfo && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/35 to-transparent ${
            compact ? "px-2 pb-2 pt-8" : "px-3 pb-3 pt-10"
          }`}
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span
              className={`truncate font-bold drop-shadow ${
                compact ? "text-xs" : "text-base"
              }`}
            >
              {isScreenShare ? `${displayName} chia sẻ` : displayName}
            </span>
            {isMicrophoneExplicitlyMuted && (
              <span
                className={`flex shrink-0 items-center justify-center rounded-full bg-red-500/90 text-white ${
                  compact ? "h-6 w-6" : "h-7 w-7"
                }`}
              >
                <MicOff size={compact ? 13 : 15} />
              </span>
            )}
          </div>
        </div>
      )}

      {showInfo && !isScreenShare && isCameraExplicitlyMuted && (
        <div
          className={`absolute right-2 top-2 flex items-center justify-center rounded-full bg-black/55 font-semibold text-white/90 backdrop-blur ${
            compact ? "h-7 w-7" : "gap-1 px-2 py-1 text-[11px]"
          }`}
          title="Camera đang tắt"
        >
          <VideoOff size={compact ? 13 : 12} />
          {!compact && <span>Tắt cam</span>}
        </div>
      )}
    </button>
  );
};

interface GroupCallStageProps {
  name?: string;
  avatar?: string;
  conversationId?: string;
  userId?: string;
  callId?: string;
  startVideo?: boolean;
  roomNotice?: string | null;
}

const GroupCallStage: React.FC<GroupCallStageProps> = ({
  name = "Cuộc gọi nhóm",
  avatar,
  conversationId,
  userId,
  callId,
  startVideo = true,
  roomNotice,
}) => {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const allVideoTracks = useTracks([
    { source: Track.Source.ScreenShare, withPlaceholder: false },
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);
  const videoTracks = useMemo(
    () =>
      allVideoTracks.filter(
        (trackRef) => trackRef.source === Track.Source.Camera,
      ),
    [allVideoTracks],
  );
  const [primaryTrackKey, setPrimaryTrackKey] = useState<string | null>(null);
  const [isFilmstripVisible, setIsFilmstripVisible] = useState(true);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isInitialMediaReady, setIsInitialMediaReady] = useState(false);
  const hasRequestedInitialMediaRef = useRef(false);
  const callConnectedAtRef = useRef<number | null>(null);
  const previousScreenShareKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (hasRequestedInitialMediaRef.current) return;
    hasRequestedInitialMediaRef.current = true;

    let isMounted = true;
    const pendingTimeoutId = window.setTimeout(() => {
      if (isMounted) {
        setIsInitialMediaReady(true);
      }
    }, INITIAL_MEDIA_PENDING_MS);

    const enableInitialMedia = async () => {
      const mediaRequests: Promise<unknown>[] = [
        localParticipant.setMicrophoneEnabled(true).catch((error) => {
          console.error("Không thể bật micro cho cuộc gọi nhóm:", error);
          setMediaNotice("Không thể bật micro. Bạn vẫn có thể tiếp tục cuộc gọi.");
        }),
      ];

      if (startVideo) {
        mediaRequests.push(
          localParticipant.setCameraEnabled(true).catch((error) => {
            console.error("Không thể bật camera cho cuộc gọi nhóm:", error);
            setMediaNotice(
              "Không thể bật camera. Có thể camera đang được ứng dụng khác sử dụng.",
            );
          }),
        );
      }

      await Promise.allSettled(mediaRequests);
      if (isMounted) {
        window.clearTimeout(pendingTimeoutId);
        setIsInitialMediaReady(true);
      }
    };

    void enableInitialMedia();

    return () => {
      isMounted = false;
      window.clearTimeout(pendingTimeoutId);
    };
  }, [localParticipant, startVideo]);

  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;

    const loadMembers = async () => {
      try {
        const data = await ParticipantService.getConversationMembers(conversationId);
        if (isMounted) {
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Không thể tải thành viên nhóm để mời vào cuộc gọi:", error);
      }
    };

    void loadMembers();

    return () => {
      isMounted = false;
    };
  }, [conversationId]);

  const memberById = useMemo(() => {
    const map = new Map<string, GroupMember>();
    members.forEach((member) => {
      if (member.user_id) {
        map.set(String(member.user_id), member);
      }
    });
    return map;
  }, [members]);

  const activeIdentitySet = useMemo(
    () => new Set(participants.map((participant) => participant.identity)),
    [participants],
  );
  const hasRemoteAnswered = useMemo(
    () =>
      participants.some(
        (participant) => String(participant.identity) !== String(userId || ""),
      ),
    [participants, userId],
  );
  const activeNotice = inviteNotice || mediaNotice || roomNotice;

  useEffect(() => {
    if (!hasRemoteAnswered) {
      callConnectedAtRef.current = null;
      setElapsedSeconds(0);
      return;
    }

    if (!callConnectedAtRef.current) {
      callConnectedAtRef.current = Date.now();
    }

    const intervalId = window.setInterval(() => {
      if (!callConnectedAtRef.current) return;
      setElapsedSeconds(
        Math.floor((Date.now() - callConnectedAtRef.current) / 1000),
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [hasRemoteAnswered]);

  const defaultPrimaryTrackKey = useMemo(() => {
    const screenSharingTrack = videoTracks.find((trackRef) =>
      hasActiveScreenShare(trackRef.participant),
    );
    if (screenSharingTrack) return getTrackKey(screenSharingTrack);

    const remoteTrack = videoTracks.find((trackRef) => !trackRef.participant.isLocal);
    return remoteTrack
      ? getTrackKey(remoteTrack)
      : videoTracks[0]
        ? getTrackKey(videoTracks[0])
        : null;
  }, [videoTracks]);
  const activeScreenShareTrackKeys = useMemo(
    () =>
      videoTracks
        .filter((trackRef) => hasActiveScreenShare(trackRef.participant))
        .map(getTrackKey),
    [videoTracks],
  );

  useEffect(() => {
    if (videoTracks.length === 0) {
      setPrimaryTrackKey(null);
      previousScreenShareKeysRef.current = new Set();
      return;
    }

    const selectedTrack = videoTracks.find(
      (trackRef) => getTrackKey(trackRef) === primaryTrackKey,
    );
    const previousScreenShareKeys = previousScreenShareKeysRef.current;
    const newlyStartedScreenShareKey = activeScreenShareTrackKeys.find(
      (trackKey) => !previousScreenShareKeys.has(trackKey),
    );
    previousScreenShareKeysRef.current = new Set(activeScreenShareTrackKeys);

    if (!selectedTrack) {
      setPrimaryTrackKey(newlyStartedScreenShareKey || defaultPrimaryTrackKey);
      return;
    }

    if (
      newlyStartedScreenShareKey &&
      !hasActiveScreenShare(selectedTrack.participant)
    ) {
      setPrimaryTrackKey(newlyStartedScreenShareKey);
    }
  }, [
    activeScreenShareTrackKeys,
    defaultPrimaryTrackKey,
    primaryTrackKey,
    videoTracks,
  ]);

  const primaryTrack =
    videoTracks.find(
      (trackRef) => getTrackKey(trackRef) === primaryTrackKey,
    ) ||
    videoTracks.find(
      (trackRef) => getTrackKey(trackRef) === defaultPrimaryTrackKey,
    ) ||
    videoTracks[0];

  const handleInviteMembers = async (targetUserIds: string[]) => {
    if (!conversationId || !userId || targetUserIds.length === 0) return;

    setIsInviting(true);
    setInviteNotice(null);
    try {
      socketService.inviteGroupCallMembers(
        conversationId,
        callId,
        userId,
        targetUserIds,
      );
      setInviteNotice(`Đã gửi lời mời tới ${targetUserIds.length} thành viên.`);
      setIsInviteOpen(false);
    } catch (error) {
      console.error("Không thể mời thêm thành viên vào cuộc gọi:", error);
      setInviteNotice("Không thể gửi lời mời. Vui lòng thử lại.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      <RoomAudioRenderer />

      <div className="absolute inset-0 z-0 bg-primary-900">
        {primaryTrack ? (
          <VideoTile
            trackRef={primaryTrack}
            memberById={memberById}
            currentUserId={userId}
            showInfo={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-950">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-3 border-primary-700 border-t-primary-300 rounded-full animate-spin" />
              <p className="text-primary-300 font-medium text-sm tracking-wide">
                Đang chờ kết nối...
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 bg-linear-to-b from-primary-950/70 via-transparent to-primary-950/80" />

      <div className="absolute top-6 left-6 right-6 z-10 flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <CallAvatar
              src={avatar}
              name={name}
              sizeClassName="h-10 w-10"
              textClassName="text-sm font-bold"
            />
            {hasRemoteAnswered && (
              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-inner flex items-center justify-center">
                <span className="text-sm font-bold tracking-wider text-[#00FF7F] drop-shadow-[0_0_8px_rgba(0,255,127,0.6)]">
                  {formatCallDuration(elapsedSeconds)}
                </span>
              </div>
            )}
            <h2 className="truncate font-display text-xl drop-shadow-lg text-primary-50">
              {name}
            </h2>
          </div>
          {!hasRemoteAnswered && (
            <span className="text-[11px] uppercase tracking-widest text-primary-300 animate-pulse bg-black/20 px-2 py-0.5 rounded w-fit">
              Đang đổ chuông...
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {activeNotice && (
            <div className="hidden rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs font-semibold text-primary-50 shadow-inner backdrop-blur-md md:block">
              {activeNotice}
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:bg-white/20"
            title="Mời thêm thành viên"
          >
            <UserPlus size={18} />
          </button>
          <button
            type="button"
            onClick={() => setIsFilmstripVisible((visible) => !visible)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 hover:bg-white/20"
            title={isFilmstripVisible ? "Ẩn danh sách camera" : "Hiện danh sách camera"}
          >
            {isFilmstripVisible ? <ChevronDown size={19} /> : <ChevronUp size={19} />}
          </button>
        </div>
      </div>

      {isFilmstripVisible && videoTracks.length > 0 && (
        <div className="absolute left-6 right-6 bottom-28 z-20 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {videoTracks.map((trackRef) => {
            const trackKey = getTrackKey(trackRef);
            return (
              <div key={trackKey} className="h-24 w-36 shrink-0">
                <VideoTile
                  trackRef={trackRef}
                  memberById={memberById}
                  currentUserId={userId}
                  compact
                  isSelected={trackKey === (primaryTrack ? getTrackKey(primaryTrack) : null)}
                  onClick={() => setPrimaryTrackKey(trackKey)}
                />
              </div>
            );
          })}
        </div>
      )}

      <GroupCallControls
        onOpenInvite={() => setIsInviteOpen(true)}
        onMediaNotice={setMediaNotice}
        canShareScreen={hasRemoteAnswered}
        isInitialMediaPending={!isInitialMediaReady}
      />

      <MemberInviteModal
        isOpen={isInviteOpen}
        members={members}
        activeIdentitySet={activeIdentitySet}
        currentUserId={userId}
        isSubmitting={isInviting}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInviteMembers}
      />
    </>
  );
};

const GroupCallControls: React.FC<{
  onOpenInvite: () => void;
  onMediaNotice: (message: string | null) => void;
  canShareScreen: boolean;
  isInitialMediaPending: boolean;
}> = ({
  onOpenInvite,
  onMediaNotice,
  canShareScreen,
  isInitialMediaPending,
}) => {
  const room = useRoomContext();
  const {
    localParticipant,
    isMicrophoneEnabled,
    isCameraEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [displayMicrophoneEnabled, setDisplayMicrophoneEnabled] = useState(true);
  const [displayCameraEnabled, setDisplayCameraEnabled] = useState(true);
  const hasChangedMicrophoneRef = useRef(false);
  const hasChangedCameraRef = useRef(false);
  const microphonePublication = getSourcePublication(
    localParticipant,
    Track.Source.Microphone,
  );
  const cameraPublication = getSourcePublication(
    localParticipant,
    Track.Source.Camera,
  );
  const actualMicrophoneEnabled = microphonePublication
    ? !microphonePublication.isMuted
    : isMicrophoneEnabled;
  const actualCameraEnabled = cameraPublication
    ? !cameraPublication.isMuted
    : isCameraEnabled;

  useEffect(() => {
    if (pendingAction === "microphone") return;
    if (isInitialMediaPending && !hasChangedMicrophoneRef.current) {
      setDisplayMicrophoneEnabled(true);
      return;
    }

    setDisplayMicrophoneEnabled(actualMicrophoneEnabled);
  }, [actualMicrophoneEnabled, isInitialMediaPending, pendingAction]);

  useEffect(() => {
    if (pendingAction === "camera") return;
    if (isInitialMediaPending && !hasChangedCameraRef.current) {
      setDisplayCameraEnabled(true);
      return;
    }

    setDisplayCameraEnabled(actualCameraEnabled);
  }, [actualCameraEnabled, isInitialMediaPending, pendingAction]);

  const runDeviceAction = async (
    actionKey: string,
    action: () => Promise<unknown>,
    fallbackMessage: string,
    onFailure?: () => void,
    timeoutMs = DEVICE_ACTION_TIMEOUT_MS,
  ) => {
    setPendingAction(actionKey);
    onMediaNotice(null);
    try {
      await withTimeout(action(), timeoutMs);
    } catch (error) {
      console.error(fallbackMessage, error);
      onFailure?.();
      onMediaNotice(fallbackMessage);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-3 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-4xl flex items-center gap-4 shadow-2xl text-white">
      <button
        type="button"
        onClick={() => {
          const nextEnabled = !displayMicrophoneEnabled;
          hasChangedMicrophoneRef.current = true;
          setDisplayMicrophoneEnabled(nextEnabled);
          runDeviceAction(
            "microphone",
            () => localParticipant.setMicrophoneEnabled(nextEnabled),
            "Không thể thay đổi trạng thái micro.",
            () => setDisplayMicrophoneEnabled(actualMicrophoneEnabled),
          );
        }}
        disabled={pendingAction === "microphone"}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
          displayMicrophoneEnabled
            ? "bg-white/10 hover:bg-white/20"
            : "bg-red-500 text-white shadow-lg shadow-red-500/20"
        } ${pendingAction === "microphone" ? "opacity-60" : ""}`}
        title={displayMicrophoneEnabled ? "Tắt micro" : "Bật micro"}
      >
        {displayMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
      </button>

      <button
        type="button"
        onClick={() => {
          const nextEnabled = !displayCameraEnabled;
          hasChangedCameraRef.current = true;
          setDisplayCameraEnabled(nextEnabled);
          runDeviceAction(
            "camera",
            () => localParticipant.setCameraEnabled(nextEnabled),
            "Không thể bật camera. Có thể camera đang được ứng dụng khác sử dụng.",
            () => setDisplayCameraEnabled(actualCameraEnabled),
          );
        }}
        disabled={isScreenShareEnabled || pendingAction === "camera"}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
          displayCameraEnabled
            ? "bg-white/10 hover:bg-white/20"
            : "bg-red-500 text-white shadow-lg shadow-red-500/20"
        } ${
          isScreenShareEnabled || pendingAction === "camera"
            ? "opacity-20"
            : ""
        }`}
        title={displayCameraEnabled ? "Tắt camera" : "Bật camera"}
      >
        {displayCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
      </button>

      <button
        type="button"
        onClick={() => {
          void room.disconnect(true);
        }}
        className="w-12 h-12 rounded-2xl bg-[#A82828] hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-red-500/30"
        title="Rời cuộc gọi"
      >
        <PhoneOff size={22} fill="currentColor" stroke="none" />
      </button>

      <button
        type="button"
        onClick={() =>
          runDeviceAction(
            "screen",
            () =>
              localParticipant.setScreenShareEnabled(!isScreenShareEnabled),
            "Không thể chia sẻ màn hình.",
            undefined,
            SCREEN_SHARE_ACTION_TIMEOUT_MS,
          )
        }
        disabled={!canShareScreen || pendingAction === "screen"}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
          isScreenShareEnabled
            ? "bg-primary-400 text-black"
            : "bg-white/10 hover:bg-white/20"
        } ${!canShareScreen || pendingAction === "screen" ? "opacity-20" : ""}`}
        title={isScreenShareEnabled ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
      >
        <MonitorUp size={18} />
      </button>

      <button
        type="button"
        onClick={onOpenInvite}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
        title="Mời thêm thành viên"
      >
        <UserPlus size={18} />
      </button>
    </div>
  );
};

const LiveKitGroupCall: React.FC<LiveKitGroupCallProps> = ({
  token,
  serverUrl,
  onLeave,
  video,
  name,
  avatar,
  conversationId,
  userId,
  callId,
}) => {
  const [roomNotice, setRoomNotice] = useState<string | null>(null);

  return (
    <div className="h-screen w-screen bg-primary-900 flex flex-col overflow-hidden relative font-body text-white selection:bg-primary-500/30">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .lk-room-container {
              background-color: transparent !important;
              border: none !important;
            }
            .lk-video-container {
              background-color: transparent !important;
            }
            .lk-button {
              border: none !important;
              min-width: unset !important;
            }
          `,
        }}
      />

      <LiveKitRoom
        video={video}
        audio
        token={typeof token === "string" ? token.trim() : undefined}
        serverUrl={typeof serverUrl === "string" ? serverUrl.trim() : undefined}
        onDisconnected={onLeave}
        onError={(error) => {
          console.error("LiveKit Room Error:", error);
          setRoomNotice("Không thể kết nối cuộc gọi. Vui lòng thử lại.");
        }}
        onMediaDeviceFailure={(failure, kind) => {
          console.error("LiveKit media device failure:", failure, kind);
          setRoomNotice(
            kind === "videoinput"
              ? "Không thể bật camera. Có thể camera đang được ứng dụng khác sử dụng."
              : "Không thể bật thiết bị âm thanh.",
          );
        }}
        className="relative z-10 flex flex-1 flex-col overflow-hidden"
      >
        <GroupCallStage
          name={name}
          avatar={avatar}
          conversationId={conversationId}
          userId={userId}
          callId={callId}
          startVideo={video}
          roomNotice={roomNotice}
        />
      </LiveKitRoom>
    </div>
  );
};

export default LiveKitGroupCall;
