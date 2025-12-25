import { motion } from 'framer-motion';
import { CheckSquare } from 'lucide-react';

const AdjudicationQueue = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold title-gradient">Adjudication Queue</h1>
        <p className="text-secondary-400 mt-2">Review and decide on pending fraud cases</p>
      </div>

      <div className="glass-panel p-6">
        <div className="text-center py-12">
          <CheckSquare className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Adjudication Queue</h3>
          <p className="text-secondary-400">Human review workflow for fraud case decisions</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AdjudicationQueue;