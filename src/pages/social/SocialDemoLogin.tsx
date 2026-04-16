import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, User } from "lucide-react";
import { fetchUserById } from "../../services/social.service";

const SocialDemoLogin: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(
    () => localStorage.getItem("socialDemoUserId") ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedId = useMemo(() => userId.trim(), [userId]);

  const handleLogin = async () => {
    if (!trimmedId) {
      setError("Vui long nhap userId.");
      return;
    }
    setLoading(true);
    setError(null);
    const user = await fetchUserById(trimmedId);
    if (!user) {
      setLoading(false);
      setError("Khong tim thay user. Vui long kiem tra userId.");
      return;
    }

    localStorage.setItem("socialDemoUserId", user.id);
    localStorage.setItem(
      "socialDemoUserName",
      user.displayName ?? user.username,
    );
    setLoading(false);
    navigate("/social", { replace: true });
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-full bg-primary-500 text-white flex items-center justify-center">
            <User className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dang nhap demo</h1>
            <p className="text-sm text-gray-500">
              Nhap userId de test tinh nang social.
            </p>
          </div>
        </div>

        <label className="text-sm font-medium text-gray-700">UserId</label>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Vi du: usr_002"
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200"
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-primary-500 text-white py-2.5 font-semibold hover:bg-primary-600 disabled:bg-gray-200 disabled:text-gray-400 transition">
          <span className="inline-flex items-center justify-center gap-2">
            <LogIn className="size-4" />
            {loading ? "Dang kiem tra..." : "Dang nhap"}
          </span>
        </button>

        <p className="mt-3 text-xs text-gray-400">
          Tip: ban co the lay userId tu DB/seed hoac log backend.
        </p>
      </div>
    </div>
  );
};

export default SocialDemoLogin;
