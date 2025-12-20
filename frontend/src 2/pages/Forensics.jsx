import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const Forensics = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold title-gradient">Forensics</h1>
        <p className="text-secondary-400 mt-2">Advanced transaction analysis and pattern detection</p>
      </div>

      <div className="glass-panel p-6">
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Forensic Analysis Tools</h3>
          <p className="text-secondary-400">Coming soon: Advanced pattern detection and transaction forensics</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Forensics;