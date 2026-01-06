import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Search, FileText } from 'lucide-react';
import { Case } from '@/types/schema';

interface SelectCaseStepProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  casesLoading: boolean;
  casesError: any;
  filteredCases: Case[];
  handleCaseSelect: (case_: Case) => void;
}

export const SelectCaseStep: React.FC<SelectCaseStepProps> = ({
  searchQuery,
  setSearchQuery,
  casesLoading,
  casesError,
  filteredCases,
  handleCaseSelect
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Select Investigation Case</h2>
        <p className="text-gray-600 mt-2">Choose the case that prompted this SAR filing</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search cases by title or ID..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {casesLoading && <div className="p-4 text-center text-gray-500">Loading cases...</div>}
          
          {casesError && <div className="p-4 text-center text-red-500">Failed to load cases</div>}

          {!casesLoading && !casesError && filteredCases.length === 0 && (
             <div className="p-4 text-center text-gray-500">No cases found matching your search.</div>
          )}

          {!casesLoading && !casesError && filteredCases.map((case_: Case) => (
            <Card
              key={case_.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCaseSelect(case_)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{case_.title}</h3>
                    <p className="text-sm text-gray-500">Case ID: {case_.id}</p>
                    <p className="text-xs text-gray-400">
                      Created: {new Date(case_.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      (case_.status as string).toLowerCase() === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {case_.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{case_.priority.toLowerCase()} priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
