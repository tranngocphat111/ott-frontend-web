import React, { useState } from "react";
import { BellOff, Pin, UserPlus, X } from "lucide-react";
import { ParticipantService } from "../../../../services";
import type { GroupActionButtonsProps } from "../../../../interfaces";

const GroupActionButtons: React.FC<GroupActionButtonsProps> = ({
  conversation,
  participant,
  currentUserId,
  onAddMember,
  onParticipantUpdated,
}) => {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [selectedMuteOption, setSelectedMuteOption] = useState<string>("1h");

  const toMutePayload = (duration: string) => {
    if (duration === "1h") {
      return { status: "mute" as const, muteUntil: new Date(Date.now() + 60 * 60 * 1000) };
    }

    if (duration === "4h") {
      return { status: "mute" as const, muteUntil: new Date(Date.now() + 4 * 60 * 60 * 1000) };
    }

    if (duration === "until-8am") {
      const now = new Date();
      const next = new Date(now);
      next.setHours(8, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return { status: "mute" as const, muteUntil: next };
    }

    return { status: "mute" as const, muteUntil: new Date("2099-12-31") };
  };

  const handleToggleMute = async () => {
    if (!currentUserId) {
      console.error("No current user ID");
      return;
    }

    const currentStatus = participant?.settings?.notification_status || "on";

    // Nếu đang mute thì bấm để bật lại ngay, không cần modal
    if (currentStatus === "mute") {
      setLoading((prev) => ({ ...prev, mute: true }));

      try {
        await ParticipantService.updateNotificationSettings(
          conversation._id,
          currentUserId,
          "on",
          null,
        );

        onParticipantUpdated?.({
          settings: {
            ...(participant?.settings || {
              is_pinned: false,
              notification_status: "on",
            }),
            notification_status: "on",
            mute_until: null,
          },
        });
      } catch (error) {
        console.error("Error toggling mute:", error);
      } finally {
        setLoading((prev) => ({ ...prev, mute: false }));
      }

      return;
    }

    setShowMuteModal(true);
  };

  const handleConfirmMute = async () => {
    if (!currentUserId) return;
    
    setLoading((prev) => ({ ...prev, mute: true }));
    try {
      const payload = toMutePayload(selectedMuteOption);
      
      await ParticipantService.updateNotificationSettings(
        conversation._id,
        currentUserId,
        payload.status,
        payload.muteUntil,
      );

      onParticipantUpdated?.({
        settings: {
          ...(participant?.settings || { is_pinned: false, notification_status: "on" }),
          notification_status: "mute",
          mute_until: payload.muteUntil ? payload.muteUntil.toISOString() : null,
        },
      });

      setShowMuteModal(false);
      
    } catch (error) {
      console.error("Error toggling mute:", error);
    } finally {
      setLoading((prev) => ({ ...prev, mute: false }));
    }
  };

  const handleTogglePin = async () => {
    if (!currentUserId) {
      console.error("No current user ID");
      return;
    }
    
    setLoading((prev) => ({ ...prev, pin: true }));
    try {
      const currentStatus = participant?.settings?.is_pinned || false;
      const newStatus = !currentStatus;
      
      await ParticipantService.updatePinStatus(
        conversation._id,
        currentUserId,
        newStatus
      );

      onParticipantUpdated?.({
        settings: {
          ...(participant?.settings || { is_pinned: false, notification_status: "on" }),
          is_pinned: newStatus,
          pinned_at: newStatus ? new Date().toISOString() : null,
        },
      });
      
    } catch (error) {
      console.error("Error toggling pin:", error);
    } finally {
      setLoading((prev) => ({ ...prev, pin: false }));
    }
  };

  const isGroupChat = conversation.type === "group";

  return (
    <>
      <div className="px-4 py-2.5 border-b border-gray-100">
      <div className={`grid ${isGroupChat ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
        <button
          onClick={handleToggleMute}
          disabled={loading.mute}
          className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-colors"
        >
          <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center ${
            participant?.settings?.notification_status === "mute" 
              ? "bg-primary-200/80" 
              : "bg-gray-100"
          }`}>
            <BellOff size={14} className={
              participant?.settings?.notification_status === "mute" 
                ? "text-primary-700" 
                : "text-gray-600"
            } />
          </div>
          <span className={`text-[12px] leading-4 text-center ${
            participant?.settings?.notification_status === "mute" 
              ? "text-primary-800" 
              : "text-gray-700"
          }`}>
            {participant?.settings?.notification_status === "mute" ? "Bật thông báo" : "Tắt thông báo"}
          </span>
        </button>

        <button
          onClick={handleTogglePin}
          disabled={loading.pin}
          className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-colors"
        >
          <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center ${
            participant?.settings?.is_pinned 
              ? "bg-primary-200/80" 
              : "bg-gray-100"
          }`}>
            <Pin size={14} className={
              participant?.settings?.is_pinned 
                ? "text-primary-600" 
                : "text-gray-600"
            } />
          </div>
          <span className={`text-[12px] leading-4 text-center ${
            participant?.settings?.is_pinned 
              ? "text-primary-600" 
              : "text-gray-700"
          }`}>
            {participant?.settings?.is_pinned ? "Bỏ ghim" : "Ghim hội thoại"}
          </span>
        </button>

        {isGroupChat && (
          <button
            onClick={() => {
              onAddMember();
            }}
            className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-colors bg-gray-50/70 hover:bg-gray-100/80 cursor-pointer"
          >
            <div className="w-6.5 h-6.5 bg-gray-100 rounded-full flex items-center justify-center">
              <UserPlus size={14} className="text-gray-600" />
            </div>
            <span className="text-[12px] leading-4 text-gray-600 text-center">Thêm thành viên</span>
          </button>
        )}
      </div>
      </div>

      {showMuteModal && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-90 rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-[15px] font-semibold text-gray-900">Tắt thông báo</h3>
              <button
                onClick={() => setShowMuteModal(false)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-4 py-3">
              <p className="mb-3 text-[13px] text-gray-700">
                Chọn thời gian tắt thông báo cho cuộc trò chuyện này:
              </p>

              <div className="space-y-2">
                {[
                  { id: "1h", label: "Trong 1 giờ" },
                  { id: "4h", label: "Trong 4 giờ" },
                  { id: "until-8am", label: "Cho đến 8:00 AM" },
                  { id: "forever", label: "Cho đến khi được mở lại" },
                ].map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-gray-800 hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="mute-duration"
                      checked={selectedMuteOption === option.id}
                      onChange={() => setSelectedMuteOption(option.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 pb-4">
              <button
                onClick={() => setShowMuteModal(false)}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmMute}
                disabled={loading.mute}
                className="rounded-md bg-amber-700 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-amber-800 disabled:opacity-60"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupActionButtons;