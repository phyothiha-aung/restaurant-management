// permission.provider.ts
import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/enums.js';
import { ROLE_HIERARCHY } from '../constants/user.constant.js';
import { User } from '../../generated/prisma/client.js';

@Injectable()
export class PermissionProvider {
  canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
  }

  validateOwnership(actor: User, targetBranchId: number | null) {
    const GLOBAL_ROLES = new Set<UserRole>([
      UserRole.SUPERADMIN,
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.MANAGER,
    ]);

    if (GLOBAL_ROLES.has(actor.role)) return true;

    if (!actor.branchId || actor.branchId !== targetBranchId) {
      throw new ForbiddenException(
        'You do not have permission to manage this branch',
      );
    }
  }
}
