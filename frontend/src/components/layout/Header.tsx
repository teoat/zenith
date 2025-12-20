// Header component - React is auto-imported in JSX transform
import { Bell, Search, User, Menu, Mic, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useSidebar } from '@/store/globalStore';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { QuickActionsMenu } from '@/components/ui/QuickActionsMenu';

import { ProjectSwitcher } from '@/components/common/ProjectSwitcher';

import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import React, { useState, useEffect, useRef } from 'react';

export const Header = () => {
  const { collapsed, setCollapsed } = useSidebar();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [devMode, setDevMode] = useState(() => localStorage.getItem('developerMode') === 'true');
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDevMode = (checked: boolean) => {
    setDevMode(checked);
    localStorage.setItem('developerMode', String(checked));
    window.dispatchEvent(new Event('developerModeChanged'));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <header className="flex flex-col border-b bg-muted/40">
      {/* Main Header Row */}
      <div className="flex h-14 items-center gap-4 px-4 lg:h-[60px] lg:px-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden md:flex" 
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <ProjectSwitcher />

        {/* Quick Actions Menu */}
        <QuickActionsMenu />

        <div className="w-full flex-1">
          <form>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Search cases, entities, or transactions"
                placeholder="Search intelligence (Cases, Entities, Signals)..."
                className="w-full appearance-none bg-background pl-8 pr-10 shadow-none md:w-2/3 lg:w-1/3"
              />
               <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-0.5 h-9 w-9 text-muted-foreground hover:text-primary md:right-[33.33%] md:mr-1 lg:right-[66.66%]"
                type="button"
                aria-label="Voice Commands"
              >
                  <Mic className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      
        {/* Offline Indicator inserted here */}
        <div className="hidden md:block">
          <OfflineIndicator />
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Regulatory Chatbot">
          <MessageSquare className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
            <Button 
                variant="secondary" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
                <User className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
            </Button>

            {isProfileOpen && (
                <div className="absolute right-0 top-10 w-64 rounded-xl border bg-card p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col space-y-2">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-semibold leading-none">Investigator</p>
                            <p className="text-xs text-muted-foreground">analyst@zenith.ai</p>
                        </div>
                        
                        {/* Gamification: Roadmap Item (User Levels) */}
                         <div className="py-2">
                            <div className="flex items-center justify-between mb-1.5">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] h-5 px-1.5">Lvl 5</Badge>
                                <span className="text-[10px] font-medium text-muted-foreground">Master Investigator</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-muted-foreground/70">
                                    <span>XP</span>
                                    <span>2450 / 3000</span>
                                </div>
                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[82%] rounded-full" />
                                </div>
                            </div>
                        </div>
                        <div className="h-px bg-border my-2" />
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="dev-mode" className="flex flex-col space-y-1 cursor-pointer">
                                <span className="text-sm font-medium">Developer Mode</span>
                                <span className="font-normal text-[10px] text-muted-foreground">Unlock design tools</span>
                            </Label>
                            <Switch id="dev-mode" checked={devMode} onCheckedChange={toggleDevMode} />
                        </div>
                        <div className="h-px bg-border my-2" />
                        <Button variant="ghost" size="sm" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2">
                            Log out
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Breadcrumbs Row */}
      <Breadcrumbs className="px-4 py-2 lg:px-6 bg-slate-50 dark:bg-slate-900/50" />
    </header>
  );
};
