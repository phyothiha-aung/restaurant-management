import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/enums.js';
import { AUTH_ROLE_KEY } from '../constants/auth.constant.js';

export const Roles = (...roles: UserRole[]) =>
  SetMetadata(AUTH_ROLE_KEY, roles);
