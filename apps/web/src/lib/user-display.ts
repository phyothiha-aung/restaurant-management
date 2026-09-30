import type { UserRole } from "@restaurant-management/shared";

export const formatRole = (role: UserRole) =>
  role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const managementRoles: UserRole[] = [
  "SUPERADMIN",
  "ADMIN",
  "OWNER",
  "MANAGER",
];

export const canManageUsers = (role: UserRole) =>
  managementRoles.includes(role) || role === "BRANCH_MANAGER";

export const canManageBranches = (role: UserRole) => managementRoles.includes(role);

export const canManageExpenses = (role: UserRole) => canManageUsers(role);

export const canManageProductCategories = (role: UserRole) =>
  managementRoles.includes(role);
