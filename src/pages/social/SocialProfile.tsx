import React from "react";
import { useParams } from "react-router-dom";
import { Camera, MapPin, Briefcase, Heart, Users, Image } from "lucide-react";
import avatar from "../../assets/avatar.png";

/**
 * SocialProfile - Trang cá nhân người dùng
 * Hiển thị thông tin cá nhân, ảnh, bài viết
 */
const SocialProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  return (
    <div className="bg-[#AE7F53] w-full min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Cover Photo */}
        <div className="relative bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 h-64 md:h-80 rounded-b-2xl">
          <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition">
            <Camera className="size-5" />
            <span className="hidden md:inline">Chỉnh sửa ảnh bìa</span>
          </button>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-2xl mx-4 -mt-16 relative shadow-lg">
          <div className="p-6">
            {/* Avatar and Name */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
              <div className="relative -mt-20">
                <div className="size-32 md:size-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  <img
                    src={avatar}
                    alt="Profile"
                    className="size-full object-cover"
                  />
                </div>
                <button className="absolute bottom-2 right-2 bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition">
                  <Camera className="size-4" />
                </button>
              </div>

              <div className="flex-1 text-center md:text-left mb-4">
                <h1 className="text-3xl font-bold text-gray-800">
                  {userId ? `User ${userId}` : "Tên người dùng"}
                </h1>
                <p className="text-gray-600 mt-1">
                  <Users className="inline size-4 mr-1" />
                  1,234 bạn bè
                </p>
              </div>

              <div className="flex gap-2 mb-4">
                <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition font-medium">
                  Thêm vào tin
                </button>
                <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium">
                  Chỉnh sửa trang cá nhân
                </button>
              </div>
            </div>

            {/* Profile Details */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Briefcase className="size-5 text-gray-500" />
                  <span>Làm việc tại Công ty ABC</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="size-5 text-gray-500" />
                  <span>Sống tại Hà Nội, Việt Nam</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Heart className="size-5 text-gray-500" />
                  <span>Độc thân</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <div className="flex gap-2 px-6 overflow-x-auto">
              <button className="px-6 py-4 text-blue-500 border-b-2 border-blue-500 font-medium whitespace-nowrap">
                Bài viết
              </button>
              <button className="px-6 py-4 text-gray-600 hover:bg-gray-100 rounded-t-lg font-medium whitespace-nowrap">
                Giới thiệu
              </button>
              <button className="px-6 py-4 text-gray-600 hover:bg-gray-100 rounded-t-lg font-medium whitespace-nowrap">
                Bạn bè
              </button>
              <button className="px-6 py-4 text-gray-600 hover:bg-gray-100 rounded-t-lg font-medium whitespace-nowrap">
                Ảnh
              </button>
              <button className="px-6 py-4 text-gray-600 hover:bg-gray-100 rounded-t-lg font-medium whitespace-nowrap">
                Video
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 mt-4">
          {/* Left Column - Intro */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow">
              <h2 className="text-xl font-bold mb-4">Giới thiệu</h2>
              <div className="space-y-3">
                <p className="text-center text-gray-600 italic">
                  Thêm tiểu sử để mọi người biết về bạn
                </p>
                <button className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-medium">
                  Chỉnh sửa chi tiết
                </button>
              </div>
            </div>

            {/* Photos */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Ảnh</h2>
                <button className="text-blue-500 hover:underline">
                  Xem tất cả
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-200 rounded-lg overflow-hidden hover:opacity-80 cursor-pointer">
                    <div className="size-full flex items-center justify-center">
                      <Image className="size-8 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Friends */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Bạn bè</h2>
                <button className="text-blue-500 hover:underline">
                  Xem tất cả
                </button>
              </div>
              <p className="text-gray-600 mb-4">1,234 người bạn</p>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="text-center">
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-2 hover:opacity-80 cursor-pointer">
                      <img
                        src={avatar}
                        alt={`Friend ${i}`}
                        className="size-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium truncate">Bạn bè {i}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Posts */}
          <div className="md:col-span-2 space-y-4">
            {/* Create Post */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-full overflow-hidden">
                  <img
                    src={avatar}
                    alt="Avatar"
                    className="size-full object-cover"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Bạn đang nghĩ gì?"
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 cursor-pointer"
                  readOnly
                />
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-lg transition">
                  <Image className="size-5 text-green-500" />
                  <span className="font-medium text-gray-700">Ảnh/Video</span>
                </button>
              </div>
            </div>

            {/* Posts List */}
            <div className="bg-white rounded-2xl p-6 shadow">
              <h3 className="text-xl font-bold mb-4">Bài viết</h3>
              <div className="text-center py-12 text-gray-500">
                <p>Chưa có bài viết nào</p>
                <p className="text-sm mt-2">Hãy chia sẻ khoảnh khắc của bạn!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialProfile;
