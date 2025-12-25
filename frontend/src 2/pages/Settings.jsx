import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

const SettingsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold title-gradient">Settings</h1>
        <p className="text-secondary-400 mt-2">Configure application preferences and system settings</p>
      </div>

      <div className="glass-panel p-6">
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Application Settings</h3>
          <p className="text-secondary-400">System configuration and user preferences</p>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;