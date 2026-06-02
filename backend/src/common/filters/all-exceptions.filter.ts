/**
 * Global exception filter.
 *
 * Produces a consistent JSON error envelope so the Next.js frontend can rely on
 * a single error shape regardless of where the failure originated:
 *
 *   {
 *     statusCode: 404,
 *     timestamp: "2026-01-15T12:34:56.789Z",
 *     path: "/api/courses/abc",
 *     method: "GET",
 *     message: "Course not found",
 *     error: "Not Found"
 *   }
 *
 * 5xx errors are logged with their stack; 4xx are silent (expected client errors).
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorBody =
      exception instanceof HttpException
        ? (exception.getResponse() as Record<string, unknown> | string)
        : { message: 'Internal server error' };

    const normalizedError =
      typeof errorBody === 'string' ? { message: errorBody } : errorBody;

    const payload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...normalizedError,
    };

    if (status >= 500) {
      this.logger.error(
        {
          err: exception,
          request: { url: request.url, method: request.method },
        },
        'Unhandled exception',
      );
    }

    response.status(status).json(payload);
  }
}
