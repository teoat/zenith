import React, { useEffect, useState } from 'react';
import useRoleBasedLayout from '../hooks/useRoleBasedLayout';
import { fetchRoles } from '../services/onboarding';

type Role = 'analyst' | 'investigator' | 'admin' | 'viewer';

const RoleSelection: React.FC = () => {
  const { role, setRole } = useRoleBasedLayout();
  const [available, setAvailable] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchRoles()
      .then((res) => {
        if (mounted) setAvailable(res.roles || []);
      })
      .catch(() => setAvailable([]))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section data-testid="role-selection">
      <h3>Choose your role</h3>
      {loading && <p>Loading roles…</p>}
      {!loading && (
        <div>
          {available.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{ marginRight: 8, fontWeight: role === r ? 'bold' : 'normal' }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
      <p>Selected: <strong>{role}</strong></p>
    </section>
  );
};

export default RoleSelection;
