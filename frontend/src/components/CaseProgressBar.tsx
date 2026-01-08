import React from 'react';

const CaseProgressBar: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Case Progress</h2>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
      </div>
      <p className="mt-2 text-sm text-gray-600">Case progress tracking placeholder.</p>
    </div>
  );
};

export default CaseProgressBar;
