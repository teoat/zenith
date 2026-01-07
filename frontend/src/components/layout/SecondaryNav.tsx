import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Shield,
  FileText,
  Bell,
  TrendingUp,
  Cpu,
  Layers,
  Zap,
  Beaker,
  GitBranch,
  FileCheck,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  id: string;
  label: string;
  basePath: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "compliance",
    label: "Compliance Suite",
    basePath: "/compliance",
    items: [
      { path: "/compliance/monitoring", label: "Monitoring", icon: Activity },
      { path: "/compliance/sar/create", label: "Create SAR", icon: FileText },
      { path: "/advanced-compliance", label: "Advanced", icon: Shield },
      {
        path: "/regulatory/intelligence",
        label: "Regulatory Intel",
        icon: Bell,
      },
      { path: "/reporting", label: "Reporting", icon: TrendingUp },
    ],
  },
  {
    id: "system",
    label: "System & Diagnostics",
    basePath: "/diagnostics",
    items: [
      { path: "/performance", label: "Performance", icon: BarChart3 },
      { path: "/diagnostics/system", label: "Diagnostics", icon: Cpu },
      { path: "/orchestration", label: "Orchestration", icon: Layers },
      { path: "/predictive-maintenance", label: "Predictive", icon: Zap },
    ],
  },
  {
    id: "ai",
    label: "AI & Development",
    basePath: "/ai",
    items: [
      { path: "/ai-lab", label: "AI Lab", icon: Beaker },
      { path: "/code-review", label: "Code Review", icon: GitBranch },
      { path: "/approvals", label: "Approvals", icon: FileCheck },
      { path: "/drafts", label: "Drafts", icon: FileText },
    ],
  },
];

// Determine which group to show based on current path
function getActiveGroup(pathname: string): NavGroup | null {
  for (const group of navGroups) {
    if (group.items.some((item) => pathname.startsWith(item.path))) {
      return group;
    }
    if (pathname.startsWith(group.basePath)) {
      return group;
    }
  }

  // Check for related paths
  if (
    pathname.includes("compliance") ||
    pathname.includes("regulatory") ||
    pathname.includes("reporting") ||
    pathname.includes("sar")
  ) {
    return navGroups.find((g) => g.id === "compliance") || null;
  }
  if (
    pathname.includes("diagnostics") ||
    pathname.includes("performance") ||
    pathname.includes("orchestration") ||
    pathname.includes("predictive")
  ) {
    return navGroups.find((g) => g.id === "system") || null;
  }
  if (
    pathname.includes("ai") ||
    pathname.includes("code-review") ||
    pathname.includes("approvals") ||
    pathname.includes("drafts")
  ) {
    return navGroups.find((g) => g.id === "ai") || null;
  }

  return null;
}

interface SecondaryNavProps {
  className?: string;
}

export const SecondaryNav: React.FC<SecondaryNavProps> = ({ className }) => {
  const location = useLocation();
  const activeGroup = getActiveGroup(location.pathname);

  if (!activeGroup) {
    return null;
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2",
        className,
      )}
      aria-label={`${activeGroup.label} navigation`}
    >
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap mr-2">
          {activeGroup.label}
        </span>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
        {activeGroup.items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all",
                  isActive
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default SecondaryNav;
