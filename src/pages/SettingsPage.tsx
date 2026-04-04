import React from 'react';
import { Settings, User, Bell, Palette, Globe } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const settingsSections = [
    {
      title: 'Tài khoản',
      icon: <User className="w-5 h-5" />,
      items: ['Thông tin cá nhân', 'Quyền riêng tư', 'Bảo mật']
    },
    {
      title: 'Thông báo',
      icon: <Bell className="w-5 h-5" />,
      items: ['Cài đặt thông báo', 'Âm thanh', 'Rung']
    },
    {
      title: 'Giao diện',
      icon: <Palette className="w-5 h-5" />,
      items: ['Chủ đề', 'Màu sắc', 'Font chữ']
    },
    {
      title: 'Ngôn ngữ',
      icon: <Globe className="w-5 h-5" />,
      items: ['Tiếng Việt', 'English']
    }
  ];

  return (
    <div className="flex h-full bg-white">
      {/* Settings Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        </div>

        {/* Settings List */}
        <div className="flex-1 overflow-y-auto p-4">
          {settingsSections.map((section, index) => (
            <div key={index} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-primary-500">{section.icon}</div>
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
              </div>
              <div className="space-y-2 ml-7">
                {section.items.map((item, idx) => (
                  <button
                    key={idx}
                    className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Detail */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-20 h-20 mx-auto mb-4 text-gray-300 animate-spin-slow" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cài đặt ứng dụng</h2>
          <p className="text-gray-500">Chọn một mục để cấu hình</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
