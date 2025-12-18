// pages/Ingestion.tsx
import React from 'react';
import FacetedFilter from '../components/cases/FacetedFilter';
import { useIngestionStore } from '../stores/useIngestionStore';
import { IngestionStepper } from '../components/ingestion/IngestionStepper';

interface FilterOption {
  id: string;
  label: string;
  type: 'checkbox' | 'slider' | 'select' | 'search';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
}

const Ingestion: React.FC = () => {
  const {
    filters,
    setFilters
  } = useIngestionStore();

  const filterOptions: FilterOption[] = [
    {
      id: 'documentType',
      label: 'Document Type',
      type: 'checkbox',
      options: [
        { value: 'bank_statement', label: 'Bank Statement' },
        { value: 'expense_report', label: 'Expense Report' },
        { value: 'general_document', label: 'General Document' },
        { value: 'image', label: 'Image' },
        { value: 'text', label: 'Text' },
      ],
    },
    {
      id: 'status',
      label: 'Processing Status',
      type: 'checkbox',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'error', label: 'Error' },
        { value: 'paused', label: 'Paused' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      id: 'minSize',
      label: 'Minimum Size (bytes)',
      type: 'slider',
      min: 0,
      max: 1000000, // 1MB
      defaultValue: 0,
    },
    {
      id: 'searchTerm',
      label: 'Search',
      type: 'search',
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Left Pane: Faceted Filter */}
      <div className="w-1/4 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto shrink-0">
        <FacetedFilter
          filterOptions={filterOptions}
          selectedFilters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Right Pane: Ingestion Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6">
        <header className="page-header mb-6">
          <h1 className="text-3xl font-bold">Data Ingestion Wizard</h1>
          <p className="text-slate-600 dark:text-slate-400">Upload, map, and process evidence files for simplified reconciliation</p>
        </header>

        <section className="flex-1 min-h-0" aria-label="Ingestion Wizard">
            <IngestionStepper />
        </section>
      </div>
    </div>
  );
};

export default Ingestion;