import React, { useEffect, useState } from 'react';
import useRoleBasedLayout from '../hooks/useRoleBasedLayout';
import { fetchRoles } from '../services/onboarding';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Shield, Search, Eye, Settings, Check } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is available based on previous edits

type Role = 'analyst' | 'investigator' | 'admin' | 'viewer';

const RoleSelection: React.FC = () => {
  const { role, setRole } = useRoleBasedLayout();
  const [available, setAvailable] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchRoles()
      .then((res) => {
         // Fallback if API returns empty during dev
        if (mounted) setAvailable(res.roles && res.roles.length > 0 ? res.roles : ['analyst', 'investigator', 'admin', 'viewer']);
      })
      .catch(() => {
          if (mounted) setAvailable(['analyst', 'investigator', 'admin', 'viewer']);
      })
      .finally(() => {
          if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const getRoleIcon = (r: Role) => {
      switch(r) {
          case 'admin': return Settings;
          case 'investigator': return Search;
          case 'analyst': return Shield;
          default: return Eye;
      }
  };

  const getRoleDescription = (r: Role) => {
      switch(r) {
          case 'admin': return "System configuration and user management";
          case 'investigator': return "Deep dive into cases and evidence chains";
          case 'analyst': return "Triage alerts and monitor dashboards";
          case 'viewer': return "Read-only access to reports";
          default: return "";
      }
  };

  if (loading) return <div className="p-4 text-muted-foreground text-sm animate-pulse">Loading roles...</div>;

  return (
    <section data-testid="role-selection" className="space-y-4">
      <div className="flex flex-col gap-1 mb-4">
         <h3 className="text-lg font-semibold tracking-tight">Select Your Role</h3>
         <p className="text-sm text-muted-foreground">Customize your workspace for your primary tasks.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {available.map((r) => {
            const Icon = getRoleIcon(r);
            const isSelected = role === r;
            
            return (
                <div
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                        "relative flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-muted/50",
                        isSelected ? "border-primary bg-primary/5" : "border-transparent bg-card shadow-sm hover:border-primary/20",
                    )}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={cn("p-2 rounded-md", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                            <span className="font-medium capitalize block">{r}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {getRoleDescription(r)}
                    </p>
                </div>
            );
        })}
      </div>
    </section>
  );
};

export default RoleSelection;
