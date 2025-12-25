import React from 'react';
import type { AppSettings } from '../../types/api';

interface SystemSettingsProps {
  settings: AppSettings;
}

const SystemSettings: React.FC<SystemSettingsProps> = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">System Settings</h2>
        <p className="text-sm text-gray-600">Configure system-level preferences and performance options.</p>
      </div>
      <div className="text-sm text-gray-500">
        System settings will be implemented here.
      </div>
    </div>
  );
};

export default SystemSettings;