import React from 'react';
import type { AppSettings } from '../../types/api';

interface NotificationSettingsProps {
  settings: AppSettings;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Notification Settings</h2>
        <p className="text-sm text-gray-600">Configure how and when you receive notifications.</p>
      </div>
      <div className="text-sm text-gray-500">
        Notification settings will be implemented here.
      </div>
    </div>
  );
};

export default NotificationSettings;