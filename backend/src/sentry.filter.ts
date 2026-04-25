import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';

/**
 * Global exception filter — capture mọi lỗi chưa handle vào Sentry.
 *
 * Bỏ qua HttpException 4xx (lỗi user input như BadRequest, Unauthorized) —
 * không phải bug. Chỉ track 5xx + lỗi không phải HttpException.
 */
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Chỉ gửi Sentry các lỗi 5xx hoặc lỗi không phải HTTP (programming bugs)
    const shouldCapture = status >= 500 || !(exception instanceof HttpException);
    if (shouldCapture && process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setExtra('url', request.url);
        scope.setExtra('method', request.method);
        scope.setExtra('userId', (request as any).user?.id);
        scope.setExtra('ip', request.ip);
        Sentry.captureException(exception);
      });
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status}`, (exception as Error)?.stack);
    }

    super.catch(exception, host);
  }
}
