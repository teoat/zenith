import React from 'react';
import { UserRole, ROLE_PERMISSIONS } from '../types/auth';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Component for displaying a user's role badge
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const roleInfo = ROLE_PERMISSIONS.find(r => r.role === role);
  
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
