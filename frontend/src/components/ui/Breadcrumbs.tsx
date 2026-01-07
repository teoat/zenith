import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

// Route configuration for generating breadcrumbs
const routeConfig: Record<string, { label: string; parent?: string }> = {
  "/": { label: "Adjudication Hub" },
  "/dashboard": { label: "Intelligence Center" },
  "/cases": { label: "Cases" },
  "/ingestion": { label: "Data Ingestion" },
  "/forensics": { label: "Forensics" },
  "/investigation": { label: "Investigation", parent: "/cases" },
  "/network": { label: "Network Analysis" },
  "/graph": { label: "Relationship Graph", parent: "/network" },
  "/reconciliation": { label: "Reconciliation" },
  "/settings": { label: "Settings" },
  "/reporting": { label: "Reporting" },
  "/approvals": { label: "Agent Approvals", parent: "/cases" },
  "/drafts": { label: "Agent Drafts", parent: "/approvals" },
  "/compliance/monitoring": { label: "Compliance Monitoring" },
  "/compliance/sar/create": {
    label: "Create SAR",
    parent: "/compliance/monitoring",
  },
  "/regulatory/intelligence": { label: "Regulatory Intelligence" },
  "/advanced-compliance": {
    label: "Advanced Compliance",
    parent: "/compliance/monitoring",
  },
  "/performance": { label: "Performance" },
  "/diagnostics/system": {
    label: "System Diagnostics",
    parent: "/performance",
  },
  "/orchestration": { label: "System Orchestration", parent: "/performance" },
  "/code-review": { label: "Code Review" },
  "/predictive-maintenance": {
    label: "Predictive Maintenance",
    parent: "/performance",
  },
  "/ai-lab": { label: "AI Lab" },
  "/evidence/enhanced": { label: "Enhanced Evidence", parent: "/forensics" },
  "/notebook": { label: "Investigation Notebook", parent: "/investigation" },
  "/playback": { label: "Temporal Playback", parent: "/investigation" },
  "/proof": { label: "Proof Visualization", parent: "/cases" },
  "/dossier": { label: "Digital Dossier", parent: "/cases" },
  "/design": { label: "Design System" },
  "/onboarding": { label: "Onboarding" },
};

function generateBreadcrumbs(
  pathname: string,
  caseId?: string,
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", path: "/", icon: <Home className="h-3.5 w-3.5" /> },
  ];

  // Handle dynamic routes
  let basePath = pathname;
  if (caseId) {
    basePath = pathname.replace(`/${caseId}`, "");
  }

  // Find current route config
  const currentConfig = routeConfig[basePath];
  if (!currentConfig) {
    // Try to find a partial match for nested routes
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      let partialPath = "";
      for (const segment of segments) {
        partialPath += `/${segment}`;
        const config = routeConfig[partialPath];
        if (config && partialPath !== "/") {
          breadcrumbs.push({ label: config.label, path: partialPath });
        }
      }
    }
    return breadcrumbs;
  }

  // Build parent chain
  const chain: { label: string; path: string }[] = [];
  let current = currentConfig;
  let currentPath = basePath;

  while (current) {
    chain.unshift({ label: current.label, path: currentPath });
    if (current.parent) {
      currentPath = current.parent;
      current = routeConfig[current.parent];
    } else {
      break;
    }
  }

  // Add chain to breadcrumbs (skip if it's home)
  for (const item of chain) {
    if (item.path !== "/") {
      breadcrumbs.push(item);
    }
  }

  // Add case ID if present
  if (
    caseId &&
    (basePath === "/cases" ||
      basePath === "/investigation" ||
      basePath === "/proof" ||
      basePath === "/dossier")
  ) {
    breadcrumbs.push({
      label: `Case #${caseId.substring(0, 8)}...`,
      path: pathname,
    });
  }

  return breadcrumbs;
}

interface BreadcrumbsProps {
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className }) => {
  const location = useLocation();
  const { caseId } = useParams<{ caseId: string }>();

  const breadcrumbs = generateBreadcrumbs(location.pathname, caseId);

  // Don't show breadcrumbs on home or if only one item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
              )}
              {isLast ? (
                <span className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {crumb.icon}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  {crumb.icon}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
