import { UserRole } from "@/types/auth";

/**
 * Hook for checking if a user has the required permission level
 */
export const useHasPermission = (
  requiredRole: UserRole,
  userRole: UserRole,
): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 5,
    MANAGER: 4,
    INVESTIGATOR: 3,
    ANALYST: 2,
    AUDITOR: 1,
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
};
