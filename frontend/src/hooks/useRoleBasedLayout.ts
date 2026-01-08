import { useState } from 'react';

type Role = 'analyst' | 'investigator' | 'admin' | 'viewer';

export function useRoleBasedLayout(initialRole: Role = 'analyst') {
  const [role, setRole] = useState<Role>(initialRole);
  const presets: Record<Role, object> = {
    analyst: { sidebar: true, density: 'compact' },
    investigator: { sidebar: true, density: 'comfortable' },
    admin: { sidebar: false, density: 'comfortable' },
    viewer: { sidebar: false, density: 'compact' },
  };

  const layoutPreset = presets[role];

  return { role, setRole, layoutPreset };
}

export default useRoleBasedLayout;
