import React from 'react';
import type { AppSettings } from '@/types/api';

interface SecuritySettingsProps {
  settings: AppSettings;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Security Settings</h2>
        <p className="text-sm text-gray-600">Configure security preferences and authentication options.</p>
      </div>
      <div className="text-sm text-gray-500">
        Security settings will be implemented here.
      </div>
    </div>
  );
};

export default SecuritySettings;