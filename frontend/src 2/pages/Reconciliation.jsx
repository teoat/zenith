import { motion } from 'framer-motion';
import { GitMerge } from 'lucide-react';

const Reconciliation = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold title-gradient">Reconciliation</h1>
        <p className="text-secondary-400 mt-2">Match and reconcile transaction data between sources</p>
      </div>

      <div className="glass-panel p-6">
        <div className="text-center py-12">
          <GitMerge className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Data Reconciliation</h3>
          <p className="text-secondary-400">Automated matching and reconciliation engine</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Reconciliation;