import { useState } from "react";
import { uploadUserAvatar } from "../../services/social.service";

export const useAvatarUpload = () => {
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const openAvatarModal = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarModalOpen(true);
  };

  const closeAvatarModal = () => {
    setAvatarModalOpen(false);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleAvatarSave = async (userId: string) => {
    if (!avatarFile) return;

    setAvatarSaving(true);
    try {
      const newUrl = await uploadUserAvatar(userId, avatarFile);
      const displayUrl = newUrl ?? avatarPreview!;
      setLocalAvatar(displayUrl);
      setAvatarModalOpen(false);
    } finally {
      setAvatarSaving(false);
    }
  };

  return {
    localAvatar,
    avatarModalOpen,
    avatarFile,
    avatarPreview,
    avatarSaving,
    openAvatarModal,
    closeAvatarModal,
    handleAvatarFileChange,
    handleAvatarSave,
  };
};
