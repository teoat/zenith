import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { TestSuggestion } from '@/types/code-review';
import { cn } from '@/lib/utils';

interface TestSuggestionsListProps {
  suggestions: TestSuggestion[];
}

export const TestSuggestionsList: React.FC<TestSuggestionsListProps> = ({ suggestions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content text-slate-900"
    >
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-2">AI-Generated Test Suggestions</h3>
        <p className="text-sm text-slate-600 mb-6">
          Based on code analysis, here are recommended test cases to improve coverage and reliability.
        </p>

        <div className="space-y-6">
          {suggestions.map((suggestion, index) => (
             <div key={index} className="border border-slate-200 rounded-lg p-5">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-2">
                      <div className="bg-green-50 p-2 rounded-full">
                         <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-semibold text-slate-900 uppercase">
                         {suggestion.test_type.replace('_', ' ')}
                      </span>
                   </div>
                   <span className={cn(
                     "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                     suggestion.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                     suggestion.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                     'bg-blue-50 text-blue-700 border-blue-100'
                   )}>
                      {suggestion.priority} Priority
                   </span>
                </div>

                <div className="mb-4">
                   <p className="text-slate-700">{suggestion.description}</p>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 mb-4 overflow-x-auto relative group">
                   <div className="absolute right-2 top-2 text-xs text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity">Example</div>
                   <pre className="text-slate-100 font-mono text-xs leading-relaxed">
                      <code>{suggestion.code_example}</code>
                   </pre>
                </div>

                <div className="grid md:grid-cols-2 gap-6 text-sm">
                   <div>
                      <h5 className="font-bold text-slate-700 text-xs uppercase mb-2">Coverage Areas:</h5>
                      <div className="flex flex-wrap gap-2">
                         {suggestion.coverage_areas.map((area, areaIndex) => (
                            <span key={areaIndex} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200 hover:bg-slate-200 transition-colors cursor-default">
                               {area.replace('_', ' ')}
                            </span>
                         ))}
                      </div>
                   </div>
                   <div>
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase text-slate-500">Complexity:</span>
                          <span className={cn(
                             "text-xs font-bold uppercase",
                             suggestion.complexity === 'high' ? 'text-red-600' :
                             suggestion.complexity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                          )}>
                             {suggestion.complexity}
                          </span>
                       </div>
                   </div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
