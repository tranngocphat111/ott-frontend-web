import React from "react";
import { Globe, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { PostUser } from "../types";
import UserAvatar from "../UserAvatar";

interface Props {
  author: PostUser;
  time: string;
  canEdit: boolean;
  showMenu: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onToggleMenu: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onProfile: (accountId: string) => void;
}

const PostHeader: React.FC<Props> = ({
  author,
  time,
  canEdit,
  showMenu,
  menuRef,
  onToggleMenu,
  onEdit,
  onDelete,
  onProfile,
}) => (
  <div className="flex items-center justify-between px-4 pt-4 pb-2">
    <div className="flex items-center gap-3">
      <div
        onClick={(e) => {
          e.stopPropagation();
          onProfile(author.id);
        }}
        className="rounded-full overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-primary-400 transition shrink-0">
        <UserAvatar user={author} size="size-10" />
      </div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onProfile(author.id);
        }}>
        <p className="font-semibold text-gray-800 hover:underline cursor-pointer leading-tight">
          {author.name}
        </p>
        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
          <span>{time}</span>
          <span>·</span>
          <Globe className="size-3" />
        </div>
      </div>
    </div>
    <div className="flex items-center">
      <div ref={menuRef} className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          className="p-2 rounded-full hover:bg-primary-50 transition">
          <MoreHorizontal className="size-5 text-primary-400" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
            {canEdit ?
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 transition">
                  <Pencil className="size-4 text-primary-400" />
                  Chỉnh sửa bài viết
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                  <Trash2 className="size-4" />
                  Xóa bài viết
                </button>
              </>
            : <p className="px-4 py-2.5 text-xs text-gray-400 select-none">
                Không có tùy chọn
              </p>
            }
          </div>
        )}
      </div>
    </div>
  </div>
);

export default PostHeader;
