// Header component - React is auto-imported in JSX transform
import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import OfflineIndicator from '@/components/OfflineIndicator';

export const Header = () => {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <div className="w-full flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search cases, entities, or transactions"
              placeholder="Search cases, entities, or transactions..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>
      
      {/* Offline Indicator inserted here */}
      <div className="hidden md:block">
         <OfflineIndicator />
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
        <Bell className="h-4 w-4" />
        <span className="sr-only">Notifications</span>
      </Button>
      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full">
        <User className="h-5 w-5" />
        <span className="sr-only">Toggle user menu</span>
      </Button>
    </header>
  );
};
