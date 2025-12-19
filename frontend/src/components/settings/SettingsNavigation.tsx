import React from 'react';

interface SettingsNavigationProps {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const SettingsNavigation: React.FC<SettingsNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default SettingsNavigation;