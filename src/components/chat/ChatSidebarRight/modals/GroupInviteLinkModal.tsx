import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, RefreshCw, Link2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ConversationService } from "../../../../services";
import { useToast } from "../../../../contexts/ToastContext";

interface GroupInviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  conversationName: string;
  currentUserId: string;
}

const GroupInviteLinkModal: React.FC<GroupInviteLinkModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  conversationName,
  currentUserId,
}) => {
  const { showToast } = useToast();
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "qr">("link");

  const fetchInviteLink = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    setLoading(true);
    try {
      const link = await ConversationService.getInviteLink(conversationId, currentUserId);
      setInviteLink(link);
    } catch (error) {
      console.error("Error fetching invite link:", error);
      // Tạo link local để demo nếu backend chưa hỗ trợ
      const fallback = `${window.location.origin}/join?group=${conversationId}`;
      setInviteLink(fallback);
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (isOpen) {
      fetchInviteLink();
    }
  }, [isOpen, fetchInviteLink]);

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      showToast("Đã sao chép link tham gia nhóm!", "success");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast("Không thể sao chép. Vui lòng sao chép thủ công.", "error");
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tham gia nhóm "${conversationName}"`,
          text: `Bạn được mời tham gia nhóm "${conversationName}" trên ứng dụng chat.`,
          url: inviteLink,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Link tham gia nhóm</h2>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tab Switch */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("link")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors cursor-pointer ${activeTab === "link"
              ? "text-primary-600 border-b-2 border-primary-500"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <Link2 size={15} />
            Link mời
          </button>
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors cursor-pointer ${activeTab === "qr"
              ? "text-primary-600 border-b-2 border-primary-500"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <QrCode size={15} />
            Mã QR
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          {activeTab === "link" ? (
            <div className="space-y-4">
              <p className="text-md text-gray-500 text-center">
                Chia sẻ link này để mời mọi người tham gia nhóm
                <span className="font-semibold text-gray-800"> "{conversationName}"</span>
              </p>

              {/* Link Box */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                {loading ? (
                  <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <span className="flex-1 text-sm text-primary-600 truncate font-mono">
                    {inviteLink || "Đang tải..."}
                  </span>
                )}
                <button
                  onClick={handleCopyLink}
                  disabled={loading || !inviteLink}
                  className="cursor-pointer p-1.5 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40"
                  title="Sao chép"
                >
                  {copied ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} className="text-gray-500" />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  disabled={loading || !inviteLink}
                  className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-500/20"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Đã sao chép!" : "Sao chép link"}
                </button>
                <button
                  onClick={handleShare}
                  disabled={loading || !inviteLink}
                  className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Chia sẻ
                </button>
              </div>
            </div>
          ) : (
            /* QR Tab */
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Quét mã QR để tham gia nhóm
                <span className="font-semibold text-gray-800"> "{conversationName}"</span>
              </p>

              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                {loading ? (
                  <div className="w-48 h-48 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
                    <RefreshCw size={24} className="text-gray-300 animate-spin" />
                  </div>
                ) : inviteLink ? (
                  <QRCodeSVG
                    value={inviteLink}
                    size={192}
                    fgColor="#1e40af"
                    bgColor="#ffffff"
                    level="M"
                    style={{ borderRadius: "8px" }}
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                    Không có QR
                  </div>
                )}
              </div>

              <button
                onClick={fetchInviteLink}
                disabled={loading}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Làm mới mã QR
              </button>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default GroupInviteLinkModal;
