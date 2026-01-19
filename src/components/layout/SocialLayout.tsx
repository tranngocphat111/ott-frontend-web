import React from "react";
import avartar from "../../assets/avatar.png";
import { Images, Smile } from "lucide-react";
const SocialLayout = () => {
  return (
    <div className="bg-[#AE7F53] w-full min-h-screen">
      <div className="m-5 grid grid-cols-3 h-full">
        <div className="h-full col-span-3 md:col-span-2">
          {/* Thanh đăng post */}
          <div className="m-2 p-2 rounded-2xl bg-white flex items-center gap-2">
            {/* âvartar */}
            <div className="size-10 shrink-0 rounded-full overflow-hidden cursor-pointer hover:opacity-80">
              <img
                className="size-full object-cover"
                src={avartar}
                alt="avartar"
              />
            </div>

            <div className="bg-gray-200 w-full px-3 py-2 rounded-full text-nowrap text-ellipsis hover:opacity-80 cursor-pointer">
              What's on your mind, user?
            </div>
            <div className="p-2 cursor-pointer rounded-xl hover:bg-gray-200">
              <Images className="size-6 text-green-400  " />
            </div>

            <div className="p-2 cursor-pointer rounded-xl hover:bg-gray-200">
              <Smile className="size-6 text-yellow-400" />
            </div>
          </div>

          {/* Thanh story */}
          <div className="m-2 p-2 bg-pink-400">thanh story</div>
          <div className="m-2 p-2 bg-blue-500 h-full">
            phần hiện thị bài post
          </div>
        </div>
        <div className="m-2 p-2 bg-amber-400 hidden md:flex h-full">
          phần bạn bè
        </div>
      </div>
    </div>
  );
};

export default SocialLayout;
