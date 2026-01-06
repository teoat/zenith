import React from 'react';
import { Button } from '@/components/ui/Button';
import { Search, FileText } from 'lucide-react';

interface DraftItemProps {
  date: string;
  title: string;
  status: string;
}

const DraftItem: React.FC<DraftItemProps> = ({ date, title, status }) => (
  <div className="p-3 border rounded-lg bg-card hover:bg-muted/50 cursor-pointer transition-colors group">
    <div className="flex justify-between items-start mb-1">
      <span className="font-medium text-sm text-foreground group-hover:text-primary">{title}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">{status}</span>
    </div>
    <p className="text-xs text-muted-foreground">{date}</p>
  </div>
);

export const SARDraftsSidebar: React.FC = () => {
  return (
    <div className="w-64 hidden lg:block space-y-4 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Drafts</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground"><Search className="h-3 w-3" /></Button>
      </div>
      <div className="space-y-2">
        <DraftItem date="Just now" title="SAR-2025-042" status="Partial" />
        <DraftItem date="2 hours ago" title="SAR-2025-041" status="Draft" />
        <DraftItem date="Yesterday" title="SAR-2025-039" status="Review" />
      </div>
      <div className="pt-4 border-t mt-4">
         <Button variant="outline" className="w-full justify-start text-xs h-8">
             <FileText className="h-3 w-3 mr-2" />
             View All Drafts
         </Button>
      </div>
    </div>
  );
};
