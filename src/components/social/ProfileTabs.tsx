import React from "react";

export type TabKey = "posts" | "about" | "photos";

interface TabItem {
  key: TabKey;
  label: string;
}

interface ProfileTabsProps {
  tabs: TabItem[];
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="border-t border-gray-200">
      <div className="flex gap-2 px-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-6 py-4 font-medium whitespace-nowrap transition text-sm ${
              activeTab === tab.key ?
                "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-600 hover:bg-gray-100 rounded-t-lg"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileTabs;
