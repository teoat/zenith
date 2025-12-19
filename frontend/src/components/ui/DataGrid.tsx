
import React from 'react';
import { VirtualList } from './VirtualList';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Pagination } from './Pagination';

export interface Column<T> {
  key: string;
  header: string;
  width?: number | string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  hideOnMobile?: boolean; // New property to hide columns on mobile
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
  height?: number;
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
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Header with sorting */}
      <div className="bg-muted/50 border-b px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-sm font-medium">Data Grid</h3>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span className="text-xs text-muted-foreground">
              {totalItems ? `${data.length} of ${totalItems}` : `${data.length} items`}
            </span>
          </div>
        </div>
      </div>

      {/* Table Header - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex bg-muted/30 border-b">
        {columns.map((col) => (
          <div
            key={col.key}
            className={cn(
              "px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
              col.width ? `w-[${col.width}px]` : "flex-1"
            )}
            style={{ width: typeof col.width === 'number' ? `${col.width}px` : col.width }}
          >
            {col.sortable ? (
              <button
                onClick={() => handleSort(col.key)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {col.header}
                {sortColumn === col.key ? (
                  sortDirection === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )
                ) : (
                  <ChevronsUpDown className="h-3 w-3 opacity-50" />
                )}
              </button>
            ) : (
              col.header
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          No results found.
        </div>
      ) : (
        <div className="overflow-x-auto md:overflow-x-visible">
          <VirtualList<T>
            items={data}
            renderItem={(item) => (
              <div className="border-b hover:bg-muted/50 transition-colors">
                {/* Desktop view */}
                <div className="hidden md:flex">
                  {columns.map((col) => (
                    <div
                      key={`${String(item.id)}-${col.key}`}
                      className={cn(
                        "px-4 py-3 text-sm",
                        col.width ? `w-[${col.width}px]` : "flex-1"
                      )}
                      style={{ width: typeof col.width === 'number' ? `${col.width}px` : col.width }}
                    >
                      {col.render ? col.render(item) : (item as any)[col.key]}
                    </div>
                  ))}
                </div>

                {/* Mobile view - Card layout */}
                <div className="md:hidden p-4">
                  <div className="space-y-2">
                    {columns.filter(col => !col.hideOnMobile).map((col) => (
                      <div key={`${String(item.id)}-${col.key}`} className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {col.header}:
                        </span>
                        <span className="text-sm">
                          {col.render ? col.render(item) : (item as any)[col.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            getItemKey={(item) => String(item.id)}
            itemHeight={rowHeight}
            containerHeight={height}
            className="no-scrollbar"
          />
        </div>
      )}

      {/* Pagination */}
      {totalItems && totalItems > pageSize && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / pageSize)}
            onPageChange={onPageChange || (() => {})}
            totalItems={totalItems || 0}
            pageSize={pageSize}
          />
        </div>
      )}
    </div>
  );
}
