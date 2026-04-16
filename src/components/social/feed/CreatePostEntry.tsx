import React from "react";
import type { PostUser } from "../types";
import CreatePostCard from "../CreatePostCard";

interface Props {
  currentUser: PostUser;
  onOpenModal: () => void;
  onOpenWithFeeling?: () => void;
}

const CreatePostEntry: React.FC<Props> = ({
  currentUser,
  onOpenModal,
  onOpenWithFeeling,
}) => (
  <CreatePostCard
    currentUser={currentUser}
    onOpenModal={onOpenModal}
    onOpenWithFeeling={onOpenWithFeeling}
  />
);

export default CreatePostEntry;
