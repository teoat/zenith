import { Bell, User, Search } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search cases, transactions..."
            className="w-full pl-10 pr-4 py-2 bg-glass-background border border-glass-border rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-glass-background-hover transition-colors">
          <Bell className="w-5 h-5 text-secondary-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-error-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-primary">John Doe</div>
            <div className="text-xs text-secondary-400">Fraud Analyst</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;