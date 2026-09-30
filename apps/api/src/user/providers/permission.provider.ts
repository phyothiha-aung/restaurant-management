// permission.provider.ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/enums.js';
import {
  BRANCH_MANAGER_ROLES,
  GLOBAL_ROLES,
  ROLE_HIERARCHY,
  USER_MANAGER_ROLES,
} from '../constants/user.constant.js';
import { User } from '../../generated/prisma/client.js';

@Injectable()
export class PermissionProvider {
  canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
  }

  manageableRoles(actorRole: UserRole): UserRole[] {
    return (Object.values(UserRole) as UserRole[]).filter((role) =>
      this.canManageRole(actorRole, role),
    );
  }

  isGlobalRole(role: UserRole) {
    return GLOBAL_ROLES.has(role);
  }

  isUserManager(role: UserRole) {
    return USER_MANAGER_ROLES.has(role);
  }

  isBranchManager(role: UserRole) {
    return BRANCH_MANAGER_ROLES.has(role);
  }

  validateOwnership(actor: User, targetBranchId: number | null) {
    if (GLOBAL_ROLES.has(actor.role)) return true;

    if (!actor.branchId || actor.branchId !== targetBranchId) {
      throw new ForbiddenException(
        'You do not have permission to manage this branch',
      );
    }

    return true;
  }

  assertCanManageUser(actor: User, target: User) {
    if (actor.id === target.id) {
      throw new ForbiddenException('You cannot manage your own account here');
    }

    if (!this.isUserManager(actor.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage users',
      );
    }

    if (!this.canManageRole(actor.role, target.role)) {
      throw new ForbiddenException('You cannot manage this user role');
    }

    this.validateOwnership(actor, target.branchId);
  }

  assertCanAssignRole(
    actor: User,
    targetRole: UserRole,
    targetBranchId: number | null,
  ) {
    if (
      !this.isUserManager(actor.role) ||
      !this.canManageRole(actor.role, targetRole)
    ) {
      throw new ForbiddenException('You cannot assign this user role');
    }

    this.validateOwnership(actor, targetBranchId);
  }
}
