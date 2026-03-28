import { useState } from "react";
import { updateUserProfile } from "../../services/social.service";
import type { UserProfile } from "../../services/social.service";

const DEFAULT_PROFILE: UserProfile = {
  bio: "",
  work: "",
  location: "",
  relationship: "",
};

export const useAboutEdit = (initialProfile: UserProfile) => {
  const [editingAbout, setEditingAbout] = useState(false);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutSaveError, setAboutSaveError] = useState<string | null>(null);

  const startEditAbout = () => {
    setDraftProfile({ ...initialProfile });
    setEditingAbout(true);
    setAboutSaveError(null);
  };

  const cancelEditAbout = () => {
    setEditingAbout(false);
    setAboutSaveError(null);
  };

  const saveAbout = async (
    userId: string,
    onSuccess: (updated: UserProfile) => void
  ) => {
    setAboutSaving(true);
    setAboutSaveError(null);

    try {
      const updated = await updateUserProfile(userId, draftProfile);
      onSuccess({
        bio: updated.bio ?? "",
        work: updated.work ?? "",
        location: updated.location ?? "",
        relationship: updated.relationshipStatus ?? "",
      });
      setEditingAbout(false);
    } catch (err) {
      setAboutSaveError(
        err instanceof Error ? err.message : "Lưu thất bại, vui lòng thử lại."
      );
    } finally {
      setAboutSaving(false);
    }
  };

  const updateDraftField = (field: keyof UserProfile, value: string) => {
    setDraftProfile((prev) => ({ ...prev, [field]: value }));
  };

  return {
    editingAbout,
    draftProfile,
    aboutSaving,
    aboutSaveError,
    startEditAbout,
    cancelEditAbout,
    saveAbout,
    updateDraftField,
  };
};
