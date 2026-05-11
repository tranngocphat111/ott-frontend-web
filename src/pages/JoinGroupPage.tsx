import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ConversationService } from "../services/conversation.service";
import { Users, Loader2, CheckCircle2, XCircle, LogIn } from "lucide-react";

type JoinState = "loading" | "joining" | "success" | "error" | "need_login";

const JoinGroupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const token = searchParams.get("token");

  const [joinState, setJoinState] = useState<JoinState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    // Chờ auth context khởi tạo xong
    if (authLoading) return;

    // Chưa đăng nhập → lưu token vào sessionStorage rồi chuyển sang /login
    if (!isAuthenticated) {
      if (token) {
        sessionStorage.setItem("pendingGroupToken", token);
      }
      setJoinState("need_login");
      return;
    }

    if (!token) {
      setErrorMsg("Link tham gia nhóm không hợp lệ hoặc đã hết hạn.");
      setJoinState("error");
      return;
    }

    handleJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, token]);

  const handleJoin = async () => {
    if (!token || !currentUser?.id) return;
    setJoinState("joining");

    try {
      const conversation = await ConversationService.joinByInviteLink(token, currentUser.id);
      setGroupName(conversation.name || "Nhóm");
      setJoinState("success");

      // Sau 1.5s → chuyển sang /chat và mở đúng conversation
      setTimeout(() => {
        navigate("/chat", { replace: true });
        // Dispatch sự kiện để ChatPage mở conversation này
        window.dispatchEvent(
          new CustomEvent("chat:open-conversation", {
            detail: {
              conversationId: conversation._id,
              conversation,
            },
          })
        );
      }, 1500);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Không thể tham gia nhóm. Vui lòng thử lại."
      );
      setJoinState("error");
    }
  };

  const handleLoginRedirect = () => {
    navigate(`/login?redirect=/join?token=${token}`, { replace: true });
  };

  // ─── UI ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-8 flex flex-col items-center text-center animate-scale-in">

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5 shadow-sm">
          <Users size={28} className="text-primary-600" />
        </div>

        {/* Content based on state */}
        {(joinState === "loading" || joinState === "joining") && (
          <>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Đang xử lý lời mời...</h1>
            <p className="text-sm text-gray-500 mb-6">
              {joinState === "loading" ? "Đang kiểm tra thông tin..." : "Đang tham gia nhóm..."}
            </p>
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </>
        )}

        {joinState === "success" && (
          <>
            <CheckCircle2 size={48} className="text-green-500 mb-3" />
            <h1 className="text-lg font-bold text-gray-900 mb-1">Tham gia thành công!</h1>
            <p className="text-sm text-gray-500 mb-4">
              Bạn đã tham gia nhóm <span className="font-semibold text-gray-800">"{groupName}"</span>.
              Đang chuyển đến chat...
            </p>
            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
              <div className="bg-primary-500 h-full rounded-full animate-[grow_1.5s_linear_forwards]" />
            </div>
          </>
        )}

        {joinState === "error" && (
          <>
            <XCircle size={48} className="text-red-400 mb-3" />
            <h1 className="text-lg font-bold text-gray-900 mb-2">Không thể tham gia</h1>
            <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate("/chat", { replace: true })}
              className="cursor-pointer w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Quay về Chat
            </button>
          </>
        )}

        {joinState === "need_login" && (
          <>
            <LogIn size={40} className="text-primary-400 mb-3" />
            <h1 className="text-lg font-bold text-gray-900 mb-2">Bạn chưa đăng nhập</h1>
            <p className="text-sm text-gray-500 mb-6">
              Đăng nhập để tham gia nhóm được mời.
            </p>
            <button
              onClick={handleLoginRedirect}
              className="cursor-pointer w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Đăng nhập
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default JoinGroupPage;
