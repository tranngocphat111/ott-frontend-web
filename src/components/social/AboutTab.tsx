import React from "react";
import {
  Pencil,
  Check,
  X,
  Loader2,
  Briefcase,
  MapPin,
  Heart,
  Phone,
} from "lucide-react";
import EditField from "./EditField";

interface UserProfile {
  bio: string;
  work: string;
  location: string;
  relationship: string;
}

interface AboutTabProps {
  profile: UserProfile;
  draftProfile: UserProfile;
  isOwner: boolean;
  editingAbout: boolean;
  aboutSaving: boolean;
  aboutSaveError: string | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onUpdateDraft: (field: keyof UserProfile, value: string) => void;
}

const AboutTab: React.FC<AboutTabProps> = ({
  profile,
  draftProfile,
  isOwner,
  editingAbout,
  aboutSaving,
  aboutSaveError,
  onStartEdit,
  onCancelEdit,
  onSave,
  onUpdateDraft,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Giới thiệu</h2>
        {isOwner && !editingAbout && (
          <button
            onClick={onStartEdit}
            className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700 font-medium">
            <Pencil className="size-4" />
            Chỉnh sửa
          </button>
        )}
        {isOwner && editingAbout && (
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              disabled={aboutSaving}
              className="flex items-center gap-1 text-sm bg-primary-500 text-white px-3 py-1.5 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition">
              {aboutSaving ?
                <Loader2 className="size-3.5 animate-spin" />
              : <Check className="size-3.5" />}
              Lưu
            </button>
            <button
              onClick={onCancelEdit}
              className="flex items-center gap-1 text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 transition">
              <X className="size-3.5" />
              Huỷ
            </button>
          </div>
        )}
      </div>

      {/* Error banner */}
      {aboutSaveError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <X className="size-4 mt-0.5 shrink-0" />
          <span>{aboutSaveError}</span>
        </div>
      )}

      {/* Bio */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Bio
        </p>
        {editingAbout ?
          <textarea
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-primary-300"
            placeholder="Viết gì đó về bản thân..."
            value={draftProfile.bio}
            onChange={(e) => onUpdateDraft("bio", e.target.value)}
          />
        : <p
            className={`text-sm ${!profile.bio ? "text-gray-400 italic" : "text-gray-700"}`}>
            {profile.bio || "Chưa có mô tả."}
          </p>
        }
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Thông tin
        </p>
        <EditField
          icon={<Briefcase className="size-4" />}
          placeholder="Nơi làm việc..."
          value={editingAbout ? draftProfile.work : profile.work}
          editing={editingAbout}
          onChange={(v) => onUpdateDraft("work", v)}
        />
        <EditField
          icon={<MapPin className="size-4" />}
          placeholder="Nơi ở hiện tại..."
          value={editingAbout ? draftProfile.location : profile.location}
          editing={editingAbout}
          onChange={(v) => onUpdateDraft("location", v)}
        />
        <EditField
          icon={<Heart className="size-4" />}
          placeholder="Tình trạng quan hệ..."
          value={
            editingAbout ? draftProfile.relationship : profile.relationship
          }
          editing={editingAbout}
          onChange={(v) => onUpdateDraft("relationship", v)}
        />
      </div>
    </div>
  );
};

export default AboutTab;
