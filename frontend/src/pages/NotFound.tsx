import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, FileText, ArrowLeft } from 'lucide-react';
import { AccessibleButton } from '../components/ui/AccessibleButton';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Illustration */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Search size={48} className="text-blue-500 dark:text-blue-400" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            404
          </h1>
          <h2 className="text-xl font-medium text-slate-700 dark:text-slate-300">
            Page Not Found
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            The page you're looking for doesn't exist. Perhaps it was moved, deleted, or you typed the URL incorrectly.
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <AccessibleButton 
            onClick={() => navigate(-1)}
            variant="secondary"
            className="w-full justify-center"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </AccessibleButton>
          
          <AccessibleButton 
            onClick={() => navigate('/')}
            className="w-full justify-center"
          >
            <Home size={16} className="mr-2" />
            Dashboard
          </AccessibleButton>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            FREQUENTLY VISITED
          </p>
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center p-3 text-sm rounded-lg hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm transition-all text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 group"
            >
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded mr-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30">
                <Home size={16} />
              </div>
              Dashboard Overview
            </button>
            
            <button 
              onClick={() => navigate('/cases')}
              className="w-full flex items-center p-3 text-sm rounded-lg hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm transition-all text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 group"
            >
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded mr-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30">
                <FileText size={16} />
              </div>
              Case Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
