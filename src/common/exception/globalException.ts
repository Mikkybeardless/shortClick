import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { SYSTEM_MESSAGES } from '../constants/system-messages';
import { CombinedLogger } from '../logger/combined.logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: CombinedLogger,
  ) {}

  catch(exception: any, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const { method, url, ip } = ctx.getRequest();
    const response = ctx.getResponse();
    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message || SYSTEM_MESSAGES.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      message,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    this.logger.error(
      `${method} ${url} - ${httpStatus} - ${ip}\nResponse: ${JSON.stringify(responseBody)}`,
      (exception as any).stack || '',
      AllExceptionsFilter.name,
    ),
      httpAdapter.reply(response, responseBody, httpStatus);
  }
}
