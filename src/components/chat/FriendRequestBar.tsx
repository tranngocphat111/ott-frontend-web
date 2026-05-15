import React from 'react';
import { UserPlus, Check, X, Clock } from 'lucide-react';
import {
  acceptFriendRequestViaChat,
  rejectFriendRequestViaChat,
  sendFriendRequestViaChat,
  cancelFriendRequestViaChat
} from '../../services/social.service';

interface FriendRequestBarProps {
  relationship: any;
  currentUserId: string;
  otherUserId: string;
  onStatusChange: () => void;
  isFetching?: boolean;
}

export const FriendRequestBar: React.FC<FriendRequestBarProps> = ({
  relationship,
  currentUserId,
  otherUserId,
  onStatusChange,
  isFetching
}) => {
  const [loading, setLoading] = React.useState(false);

  if (isFetching) return null;

  const handleAccept = async () => {
    if (!relationship?._id) return;
    setLoading(true);
    const success = await acceptFriendRequestViaChat(relationship._id, relationship);
    if (success) {
      onStatusChange();
    } else {
      alert('Chấp nhận kết bạn thất bại.');
    }
    setLoading(false);
  };

  const handleReject = async () => {
    if (!relationship?._id) return;
    setLoading(true);
    const success = await rejectFriendRequestViaChat(relationship._id, relationship);
    if (success) {
      onStatusChange();
    } else {
      alert('Từ chối kết bạn thất bại.');
    }
    setLoading(false);
  };

  const handleSendRequest = async () => {
    setLoading(true);
    const result = await sendFriendRequestViaChat(currentUserId, otherUserId);
    if (result) {
      onStatusChange();
    } else {
      alert('Gửi lời mời kết bạn thất bại.');
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!relationship?._id) return;
    setLoading(true);
    const success = await cancelFriendRequestViaChat(relationship._id, relationship);
    if (success) {
      onStatusChange();
    } else {
      alert('Hủy lời mời kết bạn thất bại.');
    }
    setLoading(false);
  };

  // State 1: Incoming Request
  if (relationship?.status === "PENDING" && relationship?.receiver_id === currentUserId) {
    return (
      <div className="bg-primary-50 border-b border-primary-100 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
            <UserPlus size={18} />
          </div>
          <p className="text-sm font-medium text-gray-800">
            Người này đã gửi lời mời kết bạn đến bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-gray-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
          >
            <X size={16} />
            Từ chối
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/20 rounded-lg transition-all"
          >
            <Check size={16} />
            Chấp nhận
          </button>
        </div>
      </div>
    );
  }

  // State 2: Outgoing Request
  if (relationship?.status === "PENDING" && relationship?.requester_id === currentUserId) {
    return (
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
            <Clock size={18} />
          </div>
          <p className="text-sm font-medium text-gray-800">
            Đã gửi lời mời kết bạn.
          </p>
        </div>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <X size={16} />
          Hủy
        </button>
      </div>
    );
  }

  // State 3: Not friends (relationship is null or removed/blocked)
  if (!relationship || relationship.status === 'REMOVED') {
    return (
      <div className="bg-primary-50 border-b border-primary-100 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
            <UserPlus size={18} />
          </div>
          <p className="text-sm font-medium text-gray-800">
            Hai bạn chưa là bạn bè.
          </p>
        </div>
        <button
          onClick={handleSendRequest}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm shadow-primary-500/20 rounded-lg transition-all"
        >
          <UserPlus size={16} />
          Gửi lời mời
        </button>
      </div>
    );
  }

  return null;
};
