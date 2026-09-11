import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ActiveUserDto } from '../dtos/active-user.dto.js';
import { JwtProvider } from '../providers/jwt.provider.js';
import { UserService } from '../../user/providers/user.service.js';
import { REQUEST_USER_KEY, TokenType } from '../constants/auth.constant.js';
import { UserStatus } from '../../generated/prisma/enums.js';

export interface RequestWithUser extends Request {
  [REQUEST_USER_KEY]: ActiveUserDto;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtProvider: JwtProvider,
    private readonly userService: UserService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    //Extract the request from the excution context
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    //Extract the access token from the authorization header
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Invalid token or expired');
    }
    //Validate the access token using the jwt service
    try {
      const payload = await this.jwtProvider.verifyToken<ActiveUserDto>(token);

      if (payload.tokenType !== TokenType.ACCESS_TOKEN) {
        throw new UnauthorizedException('Invalid token or expired');
      }

      const user = await this.userService.findOneById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Invalid token or expired');
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Invalid token or expired');
      }

      if (user.branchId && !user.branch?.isActive) {
        throw new UnauthorizedException('Invalid token or expired');
      }

      request[REQUEST_USER_KEY] = {
        ...payload,
        role: user.role,
        email: user.email,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token or expired');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token]: string[] =
      request.headers.authorization?.trim().split(/\s+/) ?? [];
    return type?.toLowerCase() === 'bearer' ? token : undefined;
  }
}
