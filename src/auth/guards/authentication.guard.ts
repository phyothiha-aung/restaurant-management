import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AUTH_ROLE_KEY,
  AUTH_TYPE_KEY,
  AuthType,
  REQUEST_USER_KEY,
} from '../constants/auth.constant.js';
import { AccessTokenGuard, RequestWithUser } from './access-token.guard.js';
import { UserRole } from '../../generated/prisma/enums.js';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private static readonly defaultAuthType = AuthType.BEARER;
  private readonly authTypeGuardMap: Record<
    AuthType,
    CanActivate | CanActivate[]
  >;
  constructor(
    private readonly reflactor: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.BEARER]: this.accessTokenGuard,
      [AuthType.NONE]: { canActivate: () => true },
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypes = this.reflactor.getAllAndOverride<AuthType[]>(
      AUTH_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [AuthenticationGuard.defaultAuthType];

    const guards = authTypes.map((type) => this.authTypeGuardMap[type]).flat();

    let error: unknown = new UnauthorizedException('Invalid token or expired');

    for (const instance of guards) {
      const canActivate = await Promise.resolve(
        instance.canActivate(context),
      ).catch((_err) => {
        error = _err;
      });

      if (canActivate) {
        this.validateRoles(context);
        return true;
      }
    }

    throw error;
  }

  private validateRoles(context: ExecutionContext) {
    const allowedRoles = this.reflactor.getAllAndOverride<UserRole[]>(
      AUTH_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedRoles?.length) {
      return;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const activeUser = request[REQUEST_USER_KEY];

    if (!activeUser) {
      throw new UnauthorizedException('Invalid token or expired');
    }

    if (!allowedRoles.includes(activeUser.role)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
  }
}
