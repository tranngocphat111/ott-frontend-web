import React, { useState, useCallback, useEffect } from 'react';
import { X, Search, UserPlus, Check, Clock, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserService } from '../../../services/user.service';
import { 
  sendFriendRequest, 
  sendFriendRequestViaChat, 
  fetchRelationshipOf, 
  fetchRelationshipStatusViaChat,
  acceptFriendRequestViaChat,
  cancelFriendRequestViaChat
} from '../../../services/social.service';
import { useAuth } from '../../../contexts/AuthContext';
import { socketService } from '../../../services/socket.service';
import { getFullUrl } from '../../../utils/fileUtils';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../../types';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [isAlreadyFriends, setIsAlreadyFriends] = useState(false);
  const [isIncomingRequest, setIsIncomingRequest] = useState(false);
  const [relationship, setRelationship] = useState<any>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Socket listener for relationship updates
  useEffect(() => {
    if (!currentUser || !isOpen) return;

    const handleRelationshipUpdate = (payload: any) => {
      // If the update involves the current user and the searched user
      if (searchResult && 
          (payload.requester_id === searchResult.user_id || 
           payload.receiver_id === searchResult.user_id)) {
        setRelationship(payload);
        setIsAlreadyFriends(payload.status === 'ACCEPTED');
        setRequestSent(payload.status === 'PENDING' && payload.requester_id === currentUser.id);
        setIsIncomingRequest(payload.status === 'PENDING' && payload.receiver_id === currentUser.id);
      }
    };

    socketService.onRelationshipUpdate(handleRelationshipUpdate);
    return () => {
      socketService.offRelationshipUpdate(handleRelationshipUpdate);
    };
  }, [currentUser, searchResult, isOpen]);

  const handleSearch = useCallback(async () => {
    if (!phoneNumber.trim() || !currentUser) return;

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);
    setRelationship(null);
    setRequestSent(false);
    setIsAlreadyFriends(false);
    setIsIncomingRequest(false);
    setAvatarError(false);

    try {
      let phoneToSearch = phoneNumber.trim();

      // Try with original phone
      let user = await UserService.getUserByPhone(phoneToSearch);

      // If not found and starts with 0, try without 0 but with 84
      if (!user && phoneToSearch.startsWith('0')) {
        user = await UserService.getUserByPhone('84' + phoneToSearch.substring(1));
      }

      // If not found and is 9 digits, try with 0 and 84
      if (!user && phoneToSearch.length === 9 && !phoneToSearch.startsWith('0')) {
        user = await UserService.getUserByPhone('0' + phoneToSearch);
        if (!user) {
          user = await UserService.getUserByPhone('84' + phoneToSearch);
        }
      }

      if (user) {
        if (user.user_id === currentUser.id || user._id === currentUser.id) {
          setSearchError('Bạn không thể kết bạn với chính mình.');
        } else {
          setSearchResult(user);
          // Check relationship status via Chat Service
          const rel = await fetchRelationshipStatusViaChat(currentUser.id, user.user_id);
          setRelationship(rel);
          if (rel) {
            if (rel.status === 'ACCEPTED') {
              setIsAlreadyFriends(true);
            } else if (rel.status === 'PENDING') {
              if (rel.requester_id === currentUser.id) {
                setRequestSent(true);
              } else {
                setIsIncomingRequest(true);
              }
            }
          }
        }
      } else {
        setSearchError('Không tìm thấy người dùng với số điện thoại này.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Đã xảy ra lỗi khi tìm kiếm.');
    } finally {
      setIsSearching(false);
    }
  }, [phoneNumber, currentUser]);

  const handleAddFriend = useCallback(async () => {
    if (!currentUser || !searchResult) return;

    setIsProcessing(true);
    try {
      const result = await sendFriendRequestViaChat(currentUser.id, searchResult.user_id);
      if (result) {
        setRequestSent(true);
        // Refresh relationship
        const rel = await fetchRelationshipStatusViaChat(currentUser.id, searchResult.user_id);
        setRelationship(rel);
      } else {
        alert('Gửi lời mời kết bạn thất bại.');
      }
    } catch (error) {
      console.error('Add friend error:', error);
      alert('Đã xảy ra lỗi.');
    } finally {
      setIsProcessing(false);
    }
  }, [currentUser, searchResult]);

  const handleAcceptFriend = useCallback(async () => {
    if (!relationship?._id) return;

    setIsProcessing(true);
    try {
      const success = await acceptFriendRequestViaChat(relationship._id);
      if (success) {
        setIsAlreadyFriends(true);
        setIsIncomingRequest(false);
        const rel = await fetchRelationshipStatusViaChat(currentUser!.id, searchResult!.user_id);
        setRelationship(rel);
      }
    } catch (error) {
      alert('Chấp nhận kết bạn thất bại.');
    } finally {
      setIsProcessing(false);
    }
  }, [relationship?._id, currentUser, searchResult]);

  const handleCancelRequest = useCallback(async () => {
    if (!relationship?._id) return;

    setIsProcessing(true);
    try {
      const success = await cancelFriendRequestViaChat(relationship._id);
      if (success) {
        setRequestSent(false);
        setRelationship(null);
      }
    } catch (error) {
      alert('Hủy yêu cầu thất bại.');
    } finally {
      setIsProcessing(false);
    }
  }, [relationship?._id]);

  const handleClose = useCallback(() => {
    setPhoneNumber('');
    setSearchResult(null);
    setRelationship(null);
    setSearchError('');
    setIsSearching(false);
    setRequestSent(false);
    setIsAlreadyFriends(false);
    setIsIncomingRequest(false);
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40  flex items-center justify-center z-60 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Thêm bạn</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[70vh]">
              <div className="p-6 space-y-6">
                {/* Phone Input Group */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all shadow-sm">
                  <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
                    <img src="https://flagcdn.com/w20/vn.png" alt="VN" className="w-5 h-auto rounded-sm" />
                    <span className="text-sm font-medium text-gray-700">(+84)</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Số điện thoại"
                    className="flex-1 bg-transparent outline-none text-gray-800 text-sm"
                  />
                </div>

                {/* Search Result Section */}
                {searchResult ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kết quả tìm kiếm</p>
                    <div
                      onClick={() => {
                        navigate(`/social/profile/${searchResult.user_id || searchResult._id}`, {
                          state: {
                            fallbackUser: {
                              displayName: searchResult.name,
                              avatarUrl: searchResult.avatar
                            }
                          }
                        });
                        onClose();
                      }}
                      className="bg-white p-4 rounded-xl flex items-center justify-between border border-gray-200 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {!avatarError && searchResult.avatar ? (
                          <img
                            src={getFullUrl(searchResult.avatar)}
                            alt={searchResult.name}
                            onError={() => setAvatarError(true)}
                            className="w-14 h-14 rounded-full object-cover border-2 border-primary-50 border-primary-100"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg border-2 border-primary-50">
                            {searchResult.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900">{searchResult.name}</h3>
                          <p className="text-xs text-gray-500">
                            {searchResult.phone ? `(+84) ${searchResult.phone.replace(/^84|^0/, '')}` : 'Người dùng hệ thống'}
                          </p>
                        </div>
                      </div>

                      {isAlreadyFriends ? (
                        <div className="flex items-center gap-1.5 text-primary-600 bg-primary-50 py-2 px-3 rounded-lg border border-primary-100">
                          <Check className="w-4 h-4" />
                          <span className="text-xs font-bold">Bạn bè</span>
                        </div>
                      ) : isIncomingRequest ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptFriend();
                          }}
                          disabled={isProcessing}
                          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-md shadow-primary-500/20 transition-all disabled:bg-gray-300"
                        >
                          <UserCheck className="w-4 h-4" />
                          {isProcessing ? 'Đang xử lý...' : 'Chấp nhận'}
                        </button>
                      ) : requestSent ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelRequest();
                          }}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 text-red-600 bg-red-50 hover:bg-red-100 py-2 px-3 rounded-lg border border-red-100 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span className="text-xs font-bold">{isProcessing ? 'Đang hủy...' : 'Hủy yêu cầu'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddFriend();
                          }}
                          disabled={isProcessing}
                          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-md shadow-primary-500/20 transition-all disabled:bg-gray-300"
                        >
                          <UserPlus className="w-4 h-4" />
                          {isProcessing ? 'Đang gửi...' : 'Kết bạn'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : searchError ? (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                      <X className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-red-600 font-medium">{searchError}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Placeholder for Recent Results */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kết quả gần nhất</p>
                      <div className="space-y-2 opacity-50 grayscale italic">
                        <p className="text-xs text-gray-400 px-2">Chưa có kết quả tìm kiếm gần đây</p>
                      </div>
                    </div>

                    {/* Placeholder for People you may know */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Có thể bạn quen</p>
                      <div className="space-y-2 opacity-50 grayscale italic">
                        <p className="text-xs text-gray-400 px-2">Không có gợi ý mới</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleClose}
                className="px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSearch}
                disabled={!phoneNumber.trim() || isSearching}
                className="px-6 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg  transition-all flex items-center gap-2"
              >
                {isSearching && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Tìm kiếm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddFriendModal;
