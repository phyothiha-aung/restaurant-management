import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r.message as string) ?? message;
        error = r.error ?? null;
      }
    } else {
      const requestContext = `${request.method} ${request.originalUrl}`;

      if (exception instanceof Error) {
        this.logger.error(
          `Unexpected error while handling ${requestContext}: ${exception.message}`,
          exception.stack,
        );
      } else {
        this.logger.error(
          `Unexpected non-error exception while handling ${requestContext}`,
        );
      }
    }

    response.status(status).json({
      statusCode: status,
      success: false,
      error,
      message,
    });
  }
}
