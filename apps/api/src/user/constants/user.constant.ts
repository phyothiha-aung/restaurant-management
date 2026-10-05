import { UserRole } from '../../generated/prisma/enums.js';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPERADMIN]: 100,
  [UserRole.ADMIN]: 90,
  [UserRole.OWNER]: 80,
  [UserRole.MANAGER]: 70,
  [UserRole.CASHIER]: 50,
  [UserRole.CHEF]: 50,
  [UserRole.WAITER]: 50,
};

export const MANAGER_ROLES = new Set<UserRole>([
  UserRole.SUPERADMIN,
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
]);

export const USER_MANAGER_ROLES = MANAGER_ROLES;
