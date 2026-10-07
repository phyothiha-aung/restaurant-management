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
  managementRoles.includes(role);

export const canManageExpenses = (role: UserRole) => canManageUsers(role);

export const canManageProductCategories = (role: UserRole) =>
  managementRoles.includes(role);

export const canViewRestaurantSettings = (role: UserRole) =>
  managementRoles.includes(role);

export const canEditRestaurantSettings = (role: UserRole) =>
  (["SUPERADMIN", "ADMIN", "OWNER"] as UserRole[]).includes(role);

export const canOperateOrders = (role: UserRole) => role !== "CHEF";
