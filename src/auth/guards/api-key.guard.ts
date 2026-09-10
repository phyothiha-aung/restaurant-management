import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const apiKey = (request.headers.get('x-api-key') as string) || '';
    const validApiKey = this.configService.get<string>('API_KEY');

    if (!validApiKey) {
      return false;
    }

    if (apiKey !== validApiKey) {
      throw new ForbiddenException('Forbidden Request');
    }

    return true;
  }
}
