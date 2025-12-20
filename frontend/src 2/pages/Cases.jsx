import { motion } from 'framer-motion';
import { FolderOpen, Plus, Search, Filter } from 'lucide-react';

const Cases = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold title-gradient">Cases</h1>
          <p className="text-secondary-400 mt-2">Manage and track fraud investigation cases</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" />
          New Case
        </button>
      </div>

      {/* Filters and Search */}
      <div className="glass-panel p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search cases..."
                className="w-full pl-10 pr-4 py-2 bg-glass-background border border-glass-border rounded-lg text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Cases Table */}
      <div className="glass-panel p-6">
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Cases Yet</h3>
          <p className="text-secondary-400 mb-6">Create your first fraud investigation case to get started.</p>
          <button className="btn btn-primary">Create First Case</button>
        </div>
      </div>
    </motion.div>
  );
};

export default Cases;