
import React from 'react';
import { VirtualList } from './VirtualList';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Pagination } from './Pagination';

export interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalItems?: number;
  isLoading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  rowHeight?: number;
  height?: number; // Container height for virtualization
}

export function DataGrid<T extends { id: string | number }>({
  data,
  columns,
  className,
  pageSize = 10,
  onPageChange,
  currentPage = 1,
  totalItems,
  isLoading = false,
  onSort,
  sortColumn,
  sortDirection,
  rowHeight = 50,
  height = 400
}: DataGridProps<T>) {

  const handleSort = (key: string) => {
    if (onSort) {
      const newDirection = sortColumn === key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(key, newDirection);
    }
  };



  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="rounded-md border">
        {/* Header */}
        <div className="flex w-full items-center border-b bg-muted/50 px-4 py-3 font-medium text-muted-foreground">
          {columns.map((col) => (
            <div
              key={col.key}
              className={cn(
                "flex items-center space-x-2 text-sm",
                col.sortable ? "cursor-pointer select-none hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded" : "",
                col.width ? `w-[${col.width}px]` : "flex-1"
              )}
              style={{ width: typeof col.width === 'number' ? `${col.width}px` : col.width }}
              onClick={() => col.sortable && handleSort(col.key)}
              onKeyDown={(e) => {
                if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleSort(col.key);
                }
              }}
              role={col.sortable ? "button" : undefined}
              tabIndex={col.sortable ? 0 : undefined}
              aria-label={col.sortable ? `Sort by ${col.header}` : undefined}
            >
              <span>{col.header}</span>
              {col.sortable && (
                <span className="ml-1">
                  {sortColumn === col.key ? (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  )}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        {isLoading ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Loading...
            </div>
        ) : data.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No results found.
            </div>
        ) : (
             <VirtualList<T>
                items={data}
                renderItem={(item) => (
                  <div className="flex w-full items-center border-b px-4 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    {columns.map((col) => (
                      <div
                        key={`${String(item.id)}-${col.key}`}
                        className={cn("flex items-center py-2 text-sm", col.width ? `w-[${col.width}px]` : "flex-1")}
                        style={{ width: typeof col.width === 'number' ? `${col.width}px` : col.width }}
                      >
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </div>
                    ))}
                  </div>
                )}
                getItemKey={(item) => String(item.id)}
                itemHeight={rowHeight}
                containerHeight={height}
                className="no-scrollbar"
            />
        )}
      </div>

      {/* Pagination */}
      {totalItems !== undefined && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / pageSize)}
          onPageChange={onPageChange || (() => {})}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}
