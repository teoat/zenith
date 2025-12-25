import { useState } from 'react';
import { Shield, Lock, AlertTriangle, Check } from 'lucide-react';
import { AccessibleButton } from '../ui/AccessibleButton';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'system' | 'admin';
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // List of permission IDs
  isSystem?: boolean;
}

const MOCK_PERMISSIONS: Permission[] = [
  { id: 'view_cases', name: 'View Cases', description: 'Can view case list and details', category: 'data' },
  { id: 'edit_cases', name: 'Edit Cases', description: 'Can modify case details', category: 'data' },
  { id: 'delete_cases', name: 'Delete Cases', description: 'Can delete cases', category: 'data' },
  { id: 'view_evidence', name: 'View Evidence', description: 'Can view evidence files', category: 'data' },
  { id: 'upload_evidence', name: 'Upload Evidence', description: 'Can upload new evidence', category: 'data' },
  { id: 'manage_users', name: 'Manage Users', description: 'Can add/remove users', category: 'admin' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Can modify system settings', category: 'system' },
  { id: 'view_audit', name: 'View Audit Logs', description: 'Can view system audit logs', category: 'system' },
];

const MOCK_ROLES: Role[] = [
  { id: 'admin', name: 'Administrator', description: 'Full system access', permissions: MOCK_PERMISSIONS.map(p => p.id), isSystem: true },
  { id: 'investigator', name: 'Investigator', description: 'Standard case management access', permissions: ['view_cases', 'edit_cases', 'view_evidence', 'upload_evidence'], isSystem: false },
  { id: 'analyst', name: 'Analyst', description: 'Read-only access to cases and evidence', permissions: ['view_cases', 'view_evidence'], isSystem: false },
  { id: 'auditor', name: 'Auditor', description: 'Access to audit logs and view-only data', permissions: ['view_cases', 'view_evidence', 'view_audit'], isSystem: false },
];

export const PermissionMatrix = () => {
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedRoles, setModifiedRoles] = useState<Role[] | null>(null);

  const handleTogglePermission = (roleId: string, permissionId: string) => {
    if (!isEditing) return;
    
    setModifiedRoles(prev => {
        if (!prev) return prev;
        return prev.map(role => {
            if (role.id === roleId) {
                if (role.isSystem && role.id === 'admin') return role; // Lock admin
                
                const hasPerm = role.permissions.includes(permissionId);
                return {
                    ...role,
                    permissions: hasPerm 
                        ? role.permissions.filter(p => p !== permissionId)
                        : [...role.permissions, permissionId]
                };
            }
            return role;
        });
    });
  };

  const startEditing = () => {
      setModifiedRoles(structuredClone(roles));
      setIsEditing(true);
  };

  const saveChanges = () => {
      if (modifiedRoles) {
          setRoles(modifiedRoles);
          setModifiedRoles(null);
          setIsEditing(false);
          // Here api.saveRoles(modifiedRoles) would be called
      }
  };

  const cancelEditing = () => {
      setModifiedRoles(null);
      setIsEditing(false);
  };

  const currentRoles = isEditing && modifiedRoles ? modifiedRoles : roles;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
               <Shield size={20} className="text-blue-500" />
               Role-Based Access Control (RBAC)
           </h3>
           <p className="text-sm text-slate-400">Manage permissions for user roles.</p>
        </div>
        <div className="flex gap-2">
            {!isEditing ? (
                <AccessibleButton onClick={startEditing} variant="secondary">
                    Edit Permissions
                </AccessibleButton>
            ) : (
                <>
                    <AccessibleButton onClick={cancelEditing} variant="ghost">Cancel</AccessibleButton>
                    <AccessibleButton onClick={saveChanges} variant="primary">Save Changes</AccessibleButton>
                </>
            )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold sticky left-0 bg-slate-950 z-10 w-64 border-r border-slate-800">Permission</th>
                <th className="px-6 py-4 font-bold border-r border-slate-800 text-center w-24">Category</th>
                {currentRoles.map(role => (
                  <th key={role.id} className="px-6 py-4 font-bold text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                          <span className={role.id === 'admin' ? 'text-blue-400' : 'text-slate-200'}>{role.name}</span>
                          {role.isSystem && <Lock size={12} className="text-slate-500" aria-label="System Role" />}
                      </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900">
              {MOCK_PERMISSIONS.map(permission => (
                <tr key={permission.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-800">
                      <div className="flex flex-col">
                          <span>{permission.name}</span>
                          <span className="text-xs text-slate-500 font-normal">{permission.description}</span>
                      </div>
                  </td>
                  <td className="px-6 py-3 text-center border-r border-slate-800">
                     <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full
                         ${permission.category === 'admin' ? 'bg-red-900/20 text-red-400' : ''}
                         ${permission.category === 'system' ? 'bg-purple-900/20 text-purple-400' : ''}
                         ${permission.category === 'data' ? 'bg-blue-900/20 text-blue-400' : ''}
                     `}>
                         {permission.category}
                     </span>
                  </td>
                  {currentRoles.map(role => {
                      const hasPerm = role.permissions.includes(permission.id);
                      const isLocked = role.isSystem && role.id === 'admin';
                      const canToggle = isEditing && !isLocked;

                      return (
                        <td key={role.id} className="px-6 py-3 text-center">
                            <button
                                onClick={() => handleTogglePermission(role.id, permission.id)}
                                disabled={!canToggle}
                                className={`
                                    w-6 h-6 rounded flex items-center justify-center mx-auto transition-all
                                    ${hasPerm 
                                        ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20' 
                                        : 'bg-slate-800 text-slate-600'
                                    }
                                    ${canToggle ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default opacity-80'}
                                    ${isLocked && hasPerm ? 'bg-slate-700 text-slate-400' : ''}
                                `}
                                aria-label={`Toggle ${permission.name} for ${role.name}`}
                                aria-pressed={hasPerm}
                            >
                                {hasPerm ? <Check size={14} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />}
                            </button>
                        </td>
                      );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isEditing && (
           <div className="flex items-center gap-2 text-yellow-500 bg-yellow-900/20 p-3 rounded-lg border border-yellow-900/50">
               <AlertTriangle size={18} />
               <p className="text-xs">
                   Caution: Removing permissions from active roles may affect currently logged-in users immediately.
               </p>
           </div>
      )}
    </div>
  );
};
