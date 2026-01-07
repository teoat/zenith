import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
  ShieldAlert,
  BarChart3,
  Database,
  WifiOff,
  Gavel,
  Palette,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSidebar } from "@/store/globalStore";

const NavItem = ({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => {
  const { collapsed } = useSidebar();

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
          collapsed ? "justify-center px-2" : "",
          isActive
            ? "bg-muted text-primary"
            : "text-muted-foreground hover:bg-muted/50",
        )
      }
      title={typeof children === "string" ? children : undefined}
    >
      <Icon className="h-4 w-4" />
      {!collapsed && children}
    </NavLink>
  );
};

export const Sidebar = () => {
  const { isOnline } = useNetworkStatus();
  const { collapsed } = useSidebar();
  const [developerMode, setDeveloperMode] = React.useState(false);

  React.useEffect(() => {
    const checkDevMode = () => {
      const isDev =
        process.env.NODE_ENV === "development" ||
        localStorage.getItem("developerMode") === "true";
      setDeveloperMode(isDev);
    };

    // Initial check
    checkDevMode();

    // Listen for updates
    window.addEventListener("developerModeChanged", checkDevMode);
    window.addEventListener("storage", checkDevMode);

    return () => {
      window.removeEventListener("developerModeChanged", checkDevMode);
      window.removeEventListener("storage", checkDevMode);
    };
  }, []);

  return (
    <div
      className={cn(
        "hidden border-r bg-muted/40 md:block h-full overflow-y-auto transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[280px]",
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div
          className={cn(
            "flex h-14 items-center border-b px-4 lg:h-[60px]",
            collapsed ? "justify-center px-0" : "px-6",
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-6 w-6 text-primary" />
            {!collapsed && <span className="">Zenith Platform</span>}
          </div>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1 mt-4">
            <NavItem to="/" icon={Gavel}>
              Adjudication Hub
            </NavItem>
            <NavItem to="/dashboard" icon={LayoutDashboard}>
              Intelligence Center
            </NavItem>
            <NavItem to="/cases" icon={Briefcase}>
              Case Management
            </NavItem>
            {/* <NavItem to="/evidence" icon={FileText}>Evidence Locker</NavItem> */}
            <NavItem to="/ingestion" icon={Database}>
              Data Ingestion
            </NavItem>
            <NavItem to="/forensics" icon={FileText}>
              Forensics
            </NavItem>
            <NavItem to="/network" icon={BarChart3}>
              Visualization
            </NavItem>
            <NavItem to="/reconciliation" icon={Briefcase}>
              Reconciliation
            </NavItem>

            {developerMode && (
              <>
                <div
                  className={cn(
                    "mt-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                    collapsed ? "hidden" : "px-2",
                  )}
                >
                  Developer
                </div>
                <NavItem to="/design" icon={Palette}>
                  Design System
                </NavItem>
                <NavItem to="/code-review" icon={Code2}>
                  Code Review
                </NavItem>
              </>
            )}
          </nav>
        </div>

        <div className="mt-auto p-4">
          {!isOnline && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-500 mb-4"
            >
              <div className="flex items-center gap-2">
                <WifiOff className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-semibold">Offline Mode</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Changes are saved locally.
              </p>
            </div>
          )}

          <nav className="grid items-start gap-1">
            <NavItem to="/settings" icon={Settings}>
              Settings
            </NavItem>
          </nav>
        </div>
      </div>
    </div>
  );
};
