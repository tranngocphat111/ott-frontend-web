import React from "react";

interface Props {
  show: boolean;
}

const EndOfFeedNotice: React.FC<Props> = ({ show }) => {
  if (!show) return null;
  return (
    <p className="text-center text-sm text-gray-400 py-4">
      Bạn đã xem hết tất cả bài viết
    </p>
  );
};

export default EndOfFeedNotice;
