// User Role Management Component with MANAGER role support
import React from 'react';

export type UserRole = 'ADMIN' | 'MANAGER' | 'INVESTIGATOR' | 'ANALYST' | 'AUDITOR';

interface RoleSelectorProps {
  currentRole: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

interface RolePermission {
  role: UserRole;
  label: string;
  description: string;
  color: string;
  permissions: string[];
}

const rolePermissions: RolePermission[] = [
  {
    role: 'ADMIN',
    label: 'Administrator',
    description: 'Full system access and configuration',
    color: 'red',
    permissions: ['All', 'system management', 'user management', 'security config']
  },
  {
    role: 'MANAGER',
    label: 'Manager',
    description: 'Team and case management, reporting access',
    color: 'purple',
    permissions: ['Team oversight', 'case assignment', 'reports', 'manage investigations']
  },
  {
    role: 'INVESTIGATOR',
    label: 'Investigator',
    description: 'Full investigation and case management capabilities',
    color: 'blue',
    permissions: ['Create cases', 'update cases', 'evidence management', 'network analysis']
  },
  {
    role: 'ANALYST',
    label: 'Analyst',
    description: 'Analysis and review access',
    color: 'green',
    permissions: ['View cases', 'analyze transactions', 'generate reports']
  },
  {
    role: 'AUDITOR',
    label: 'Auditor',
    description: 'Read-only access for compliance and auditing',
    color: 'yellow',
    permissions: ['View all', 'audit logs', 'export data']
  }
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  currentRole, 
  onChange, 
  disabled = false 
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        User Role
      </label>
      
      <select
        value={currentRole}
        onChange={(e) => onChange(e.target.value as UserRole)}
        disabled={disabled}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 
                   focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 
                   sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 
                   dark:text-white disabled:opacity-50"
      >
        {rolePermissions.map(roleInfo => (
          <option key={roleInfo.role} value={roleInfo.role}>
            {roleInfo.label}
          </option>
        ))}
      </select>
      
      {/* Role description */}
      {rolePermissions.find(r => r.role === currentRole) && (
        <div className={`p-3 rounded-lg bg-${
          rolePermissions.find(r => r.role === currentRole)?.color
        }-50 dark:bg-${
          rolePermissions.find(r => r.role === currentRole)?.color
        }-900 border border-${
          rolePermissions.find(r => r.role === currentRole)?.color
        }-200`}>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {rolePermissions.find(r => r.role === currentRole)?.description}
          </p>
          <div className="mt-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
              Permissions:
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {rolePermissions.find(r => r.role === currentRole)?.permissions.map((perm, idx) => (
                <li key={idx} className="flex items-center">
                  <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {perm}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Role Badge Component
interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const roleInfo = rolePermissions.find(r => r.role === role);
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  const colorClasses = {
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  };
  
  return (
    <span className={`
      inline-flex items-center rounded-full font-medium
      ${sizeClasses[size]}
      ${colorClasses[roleInfo?.color as keyof typeof colorClasses] || colorClasses.blue}
    `}>
      {roleInfo?.label || role}
    </span>
  );
};

// Role Permission Check Hook
export const useHasPermission = (requiredRole: UserRole, userRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 5,
    MANAGER: 4,
    INVESTIGATOR: 3,
    ANALYST: 2,
    AUDITOR: 1
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Example Usage Component
export const UserManagementExample: React.FC = () => {
  const [selectedRole, setSelectedRole] = React.useState<UserRole>('ANALYST');
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Assign User Role</h3>
      
      <RoleSelector 
        currentRole={selectedRole}
        onChange={setSelectedRole}
      />
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selected role badge:
        </p>
        <div className="mt-2">
          <RoleBadge role={selectedRole} size="lg" />
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
