// permission.provider.ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/enums.js';
import {
  MANAGER_ROLES,
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

  isUserManager(role: UserRole) {
    return USER_MANAGER_ROLES.has(role);
  }

  isManager(role: UserRole) {
    return MANAGER_ROLES.has(role);
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
  }

  assertCanAssignRole(actor: User, targetRole: UserRole) {
    if (
      !this.isUserManager(actor.role) ||
      !this.canManageRole(actor.role, targetRole)
    ) {
      throw new ForbiddenException('You cannot assign this user role');
    }
  }
}
