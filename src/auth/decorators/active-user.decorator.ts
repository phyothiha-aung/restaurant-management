import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ActiveUserDto } from '../dtos/active-user.dto.js';
import { RequestWithUser } from '../guards/access-token.guard.js';
import { REQUEST_USER_KEY } from '../constants/auth.constant.js';

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserDto | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request[REQUEST_USER_KEY];
    return field ? user?.[field] : user;
  },
);
