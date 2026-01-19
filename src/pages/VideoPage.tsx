import React from 'react';
import { Video, VideoOff } from 'lucide-react';

const VideoPage: React.FC = () => {
  return (
    <div className="flex h-full bg-white items-center justify-center">
      <div className="text-center">
        <div className="flex gap-4 justify-center mb-6">
          <div className="p-6 bg-purple-50 rounded-full">
            <Video className="w-12 h-12 text-purple-600" />
          </div>
          <div className="p-6 bg-gray-50 rounded-full">
            <VideoOff className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Call</h2>
        <p className="text-gray-600 mb-6">Bắt đầu cuộc gọi video với bạn bè</p>
        <button className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          Tạo cuộc họp mới
        </button>
      </div>
    </div>
  );
};

export default VideoPage;
