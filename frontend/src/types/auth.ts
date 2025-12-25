export type UserRole = 'ADMIN' | 'MANAGER' | 'INVESTIGATOR' | 'ANALYST' | 'AUDITOR';

export interface RolePermission {
  role: UserRole;
  label: string;
  description: string;
  color: string;
  permissions: string[];
}

export const ROLE_PERMISSIONS: RolePermission[] = [
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
