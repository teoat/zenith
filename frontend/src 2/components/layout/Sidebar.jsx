import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  CheckSquare,
  Upload,
  GitMerge,
  Settings,
  Shield
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Forensics', href: '/forensics', icon: Search },
  { name: 'Adjudication', href: '/adjudication', icon: CheckSquare },
  { name: 'Ingestion', href: '/ingestion', icon: Upload },
  { name: 'Reconciliation', href: '/reconciliation', icon: GitMerge },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-glass-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold title-gradient">Simple378</h1>
            <p className="text-xs text-secondary-400">Fraud Detection</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      : 'text-secondary-400 hover:text-primary-400 hover:bg-glass-background-hover'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-glass-border">
        <div className="text-xs text-secondary-500 text-center">
          v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;