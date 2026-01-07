import React from "react";
import { Settings } from "lucide-react";

const SettingsHeader: React.FC = () => {
  return (
    <div className="text-center">
      <Settings className="mx-auto h-12 w-12 text-blue-600 mb-4" />
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      <p className="text-gray-600 mt-2">
        Configure your application preferences and behavior
      </p>
    </div>
  );
};

export default SettingsHeader;
