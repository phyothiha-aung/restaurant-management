import type { UserRole, UserStatus } from "@restaurant-management/shared";

export const USER_ROLES = [
  "SUPERADMIN",
  "ADMIN",
  "OWNER",
  "MANAGER",
  "BRANCH_MANAGER",
  "CASHIER",
  "CHEF",
  "WAITER",
] as const satisfies readonly UserRole[];

export const USER_STATUSES = [
  "ACTIVE",
  "PENDING",
  "INACTIVE",
] as const satisfies readonly UserStatus[];

export const GLOBAL_USER_ROLES = new Set<UserRole>([
  "SUPERADMIN",
  "ADMIN",
  "OWNER",
  "MANAGER",
]);

const ROLE_RANK: Record<UserRole, number> = {
  SUPERADMIN: 100,
  ADMIN: 90,
  OWNER: 80,
  MANAGER: 70,
  BRANCH_MANAGER: 60,
  CASHIER: 50,
  CHEF: 50,
  WAITER: 50,
};

export const isGlobalUserRole = (role: UserRole) =>
  GLOBAL_USER_ROLES.has(role);

export const getManageableRoles = (actorRole: UserRole) =>
  USER_ROLES.filter((role) => ROLE_RANK[actorRole] > ROLE_RANK[role]);

export const isUserRole = (value: string | null): value is UserRole =>
  value !== null && USER_ROLES.includes(value as UserRole);

export const isUserStatus = (value: string | null): value is UserStatus =>
  value !== null && USER_STATUSES.includes(value as UserStatus);
