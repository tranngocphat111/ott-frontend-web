import React from "react";

interface CreatePostModalFooterProps {
  onSubmit: () => void;
  canPost: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const CreatePostModalFooter: React.FC<CreatePostModalFooterProps> = ({
  onSubmit,
  canPost,
  isSubmitting = false,
  submitLabel = "Đăng",
}) => {
  return (
    <div className="px-4 pb-4 pt-2 border-t border-gray-100">
      <button
        onClick={onSubmit}
        disabled={!canPost || isSubmitting}
        className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm">
        {isSubmitting ? "Đang xử lý..." : submitLabel}
      </button>
    </div>
  );
};

export default CreatePostModalFooter;
