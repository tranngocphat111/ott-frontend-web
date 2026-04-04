import React from "react";
import { Gift, Users } from "lucide-react";
import avatar from "../../assets/avatar.png";

/* TODO: fetch từ GET /friends/requests khi backend có endpoint */
const FRIEND_REQUESTS: {
  id: string;
  name: string;
  mutualFriends: number;
  time: string;
}[] = [];

const SocialRightSidebar: React.FC = () => (
  <aside className="w-80 shrink-0 hidden lg:block">
    <div className="sticky top-4 space-y-5">
      {/* ── Sponsored ────────────────────────────────── */}
      <div>
        <h3 className="font-semibold text-primary-600 mb-3 text-sm uppercase tracking-wide">
          Được tài trợ
        </h3>
        <div className="flex gap-3 cursor-pointer group rounded-xl p-2 hover:bg-primary-100 transition">
          <div className="size-28 rounded-xl bg-linear-to-br from-orange-400 to-red-500 shrink-0 shadow" />
          <div>
            <p className="font-semibold text-sm text-gray-800 group-hover:underline leading-snug">
              Time to Learn: Up to 90% Off Courses
            </p>
            <p className="text-xs text-gray-400 mt-1">courseking.org</p>
          </div>
        </div>
        <div className="flex gap-3 cursor-pointer group rounded-xl p-2 hover:bg-primary-100 transition mt-1">
          <div className="size-28 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shrink-0 shadow flex items-center justify-center">
            <span className="text-white text-xs font-bold text-center px-1">
              Happy Lunar New Year 2026
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800 group-hover:underline leading-snug">
              Set the pace this Lunar New Year. Save 10% on PTE.
            </p>
            <p className="text-xs text-gray-400 mt-1">pearsonpte.com</p>
          </div>
        </div>
      </div>

      {/* ── Friend Requests ──────────────────────────── */}
      <div className="border-t border-primary-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-primary-800">Lời mời kết bạn</h3>
          <button className="text-primary-500 font-medium text-sm hover:underline">
            Xem tất cả
          </button>
        </div>
        {FRIEND_REQUESTS.length === 0 ?
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Users className="size-8 text-primary-200" />
            <p className="text-xs text-gray-400">Chưa có lời mời kết bạn nào</p>
          </div>
        : FRIEND_REQUESTS.map((req) => (
            <div key={req.id} className="flex items-start gap-3">
              <div className="size-14 rounded-full overflow-hidden shrink-0 shadow">
                <img
                  src={avatar}
                  alt={req.name}
                  className="size-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {req.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {req.mutualFriends} bạn chung · {req.time}
                </p>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-1.5 rounded-lg text-sm font-medium transition">
                    Xác nhận
                  </button>
                  <button className="flex-1 bg-primary-100 hover:bg-primary-200 text-primary-800 py-1.5 rounded-lg text-sm font-medium transition">
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Birthdays ────────────────────────────────── */}
      <div className="border-t border-primary-200 pt-4">
        <h3 className="font-semibold text-primary-800 mb-3">Sinh nhật</h3>
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-primary-100 cursor-pointer transition">
          <Gift className="size-8 text-primary-500 shrink-0" />
          <p className="text-sm text-gray-700">
            Hôm nay là sinh nhật của{" "}
            <span className="font-semibold">Tấn Nghi</span>.
          </p>
        </div>
      </div>
    </div>
  </aside>
);

export default SocialRightSidebar;
