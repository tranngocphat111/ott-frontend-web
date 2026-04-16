import { useState } from "react";
import { uploadUserCover } from "../../services/social.service";

export const useCoverUpload = () => {
  const [localCover, setLocalCover] = useState<string | null>(null);
  const [coverModalOpen, setCoverModalOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverSaving, setCoverSaving] = useState(false);

  const openCoverModal = () => {
    setCoverPreview(null);
    setCoverFile(null);
    setCoverModalOpen(true);
  };

  const closeCoverModal = () => {
    setCoverModalOpen(false);
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleCoverSave = async (userId: string) => {
    if (!coverFile) return;

    setCoverSaving(true);
    try {
      const newUrl = await uploadUserCover(userId, coverFile);
      setLocalCover(newUrl ?? coverPreview!);
      setCoverModalOpen(false);
    } finally {
      setCoverSaving(false);
    }
  };

  return {
    localCover,
    coverModalOpen,
    coverFile,
    coverPreview,
    coverSaving,
    openCoverModal,
    closeCoverModal,
    handleCoverFileChange,
    handleCoverSave,
  };
};
