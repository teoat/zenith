import React from "react";
import { UserRole, ROLE_PERMISSIONS } from "@/types/auth";

interface RoleSelectorProps {
  currentRole: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

/**
 * User Role Management Component with MANAGER role support
 */
export const RoleSelector: React.FC<RoleSelectorProps> = ({
  currentRole,
  onChange,
  disabled = false,
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
        {ROLE_PERMISSIONS.map((roleInfo) => (
          <option key={roleInfo.role} value={roleInfo.role}>
            {roleInfo.label}
          </option>
        ))}
      </select>

      {/* Role description */}
      {ROLE_PERMISSIONS.find((r) => r.role === currentRole) && (
        <div
          className={`p-3 rounded-lg bg-${
            ROLE_PERMISSIONS.find((r) => r.role === currentRole)?.color
          }-50 dark:bg-${
            ROLE_PERMISSIONS.find((r) => r.role === currentRole)?.color
          }-900 border border-${
            ROLE_PERMISSIONS.find((r) => r.role === currentRole)?.color
          }-200`}
        >
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {ROLE_PERMISSIONS.find((r) => r.role === currentRole)?.description}
          </p>
          <div className="mt-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
              Permissions:
            </p>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {ROLE_PERMISSIONS.find(
                (r) => r.role === currentRole,
              )?.permissions.map((perm, idx) => (
                <li key={idx} className="flex items-center">
                  <svg
                    className="w-3 h-3 mr-1 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
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

export default RoleSelector;
