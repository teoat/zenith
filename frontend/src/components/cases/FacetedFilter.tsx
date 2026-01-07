import React, { useState, useEffect } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Filter, Search } from 'lucide-react';

type FilterValue = string | number | string[];

interface FilterOption {
  id: string;
  label: string;
  type: 'checkbox' | 'slider' | 'select' | 'search';
  options?: { value: string; label: string }[]; // For checkbox/select
  min?: number; // For slider
  max?: number; // For slider
  defaultValue?: FilterValue; // For slider or select
}

interface FacetedFilterProps {
  filterOptions: FilterOption[];
  selectedFilters: Record<string, FilterValue>;
  onFilterChange: (filters: Record<string, FilterValue>) => void;
}

const FacetedFilter: React.FC<FacetedFilterProps> = ({ filterOptions, selectedFilters, onFilterChange }) => {
  const [internalFilters, setInternalFilters] = useState<Record<string, FilterValue>>(selectedFilters);

  useEffect(() => {
    setInternalFilters(selectedFilters);
  }, [selectedFilters]);

  const handleFilterChange = (filterId: string, value: FilterValue) => {
    const newFilters = {
      ...internalFilters,
      [filterId]: value,
    };
    setInternalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCheckboxChange = (filterId: string, optionValue: string, isChecked: boolean) => {
    // Ensure currentValues is treated as an array of strings for checkbox logic
    const currentVal = internalFilters[filterId];
    const currentValues: string[] = Array.isArray(currentVal) ? currentVal : [];
    
    const newValues = isChecked
      ? [...currentValues, optionValue]
      : currentValues.filter((val: string) => val !== optionValue);
    handleFilterChange(filterId, newValues);
  };

  const handleSliderChange = (filterId: string, value: number[]) => {
    handleFilterChange(filterId, value[0]);
  };

  const handleSelectChange = (filterId: string, event: React.ChangeEvent<HTMLSelectElement>) => {
    handleFilterChange(filterId, event.target.value);
  };

  const handleSearchChange = (filterId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange(filterId, event.target.value);
  };

  const handleResetFilters = () => {
    const resetFilters: Record<string, FilterValue> = {};
    filterOptions.forEach(option => {
      if (option.type === 'slider') {
        resetFilters[option.id] = (option.defaultValue ?? option.min) as FilterValue;
      } else if (option.type === 'select') {
        resetFilters[option.id] = (option.defaultValue ?? '') as FilterValue;
      } else if (option.type === 'checkbox') {
        resetFilters[option.id] = [];
      } else if (option.type === 'search') {
        resetFilters[option.id] = '';
      }
    });
    setInternalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 hidden lg:block h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-6 text-slate-500">
        <Filter size={18} />
        <h3 className="font-bold uppercase text-xs tracking-wider">Filters</h3>
      </div>

      {filterOptions.map(option => (
        <div key={option.id} className="mb-6">
          <h4 className="text-sm font-bold mb-3">{option.label}</h4>
          {option.type === 'search' && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder={`Search ${option.label.toLowerCase()}...`} 
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={internalFilters[option.id] || ''}
                onChange={(e) => handleSearchChange(option.id, e)}
              />
            </div>
          )}
          {option.type === 'checkbox' && (
            <div className="space-y-2">
              {option.options?.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={Array.isArray(internalFilters[option.id]) ? (internalFilters[option.id] as string[]).includes(opt.value) : false}
                    onChange={(e) => handleCheckboxChange(option.id, opt.value, e.target.checked)}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-600">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
          {option.type === 'slider' && option.min !== undefined && option.max !== undefined && (
            <>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-mono text-slate-500">{option.min}-{option.max}</span>
                <span className="text-sm font-bold">{String(internalFilters[option.id] ?? option.defaultValue ?? option.min)}</span>
              </div>
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[(internalFilters[option.id] ?? option.defaultValue ?? option.min) as number]}
                max={option.max} 
                step={1}
                onValueChange={(value) => handleSliderChange(option.id, value)}
              >
                <Slider.Track className="bg-slate-200 dark:bg-slate-700 relative grow rounded-full h-[3px]">
                  <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb 
                  className="block w-4 h-4 bg-white border-2 border-blue-500 shadow-lg rounded-[10px] hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-transform" 
                  aria-label={option.label} 
                />
              </Slider.Root>
            </>
          )}
          {option.type === 'select' && (
            <select 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm"
              value={internalFilters[option.id] || option.defaultValue || ''}
              onChange={(e) => handleSelectChange(option.id, e)}
            >
              {option.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>
      ))}

      <button 
        onClick={handleResetFilters}
        className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition-colors mt-6"
      >
        Reset All Filters
      </button>
    </div>
  );
};

export default FacetedFilter;
