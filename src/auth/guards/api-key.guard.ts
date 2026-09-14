import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.get('x-api-key');
    const validApiKey = this.configService.get<string>('API_KEY');

    if (!validApiKey || !apiKey) {
      throw new ForbiddenException('Forbidden Request');
    }

    const suppliedKey = Buffer.from(apiKey);
    const configuredKey = Buffer.from(validApiKey);

    if (
      suppliedKey.length !== configuredKey.length ||
      !timingSafeEqual(suppliedKey, configuredKey)
    ) {
      throw new ForbiddenException('Forbidden Request');
    }

    return true;
  }
}
