import { useState, useCallback } from "react";

export const useSocialFeedModal = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openWithFeeling, setOpenWithFeeling] = useState(false);

    const openModal = useCallback((withFeeling = false) => {
        setOpenWithFeeling(withFeeling);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setOpenWithFeeling(false);
    }, []);

    return {
        isModalOpen,
        openWithFeeling,
        openModal,
        closeModal,
    };
};
