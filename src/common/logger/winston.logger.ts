import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { createLogger, format, Logger, transports } from 'winston';
const { combine, timestamp, printf, errors, splat, colorize } = format;
import 'winston-daily-rotate-file';

@Injectable({ scope: Scope.TRANSIENT })
export class WinstonLogger implements LoggerService {
  private readonly logger: Logger;
  private context: string = 'Application';
  private readonly serviceName: string = 'Short-clicks';
  private readonly isProd: boolean = process.env.NODE_ENV === 'production';
  private readonly jsonFormat = printf((info) => {
    return JSON.stringify({
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      context: info.context,
      pid: process.pid,
      service: this.serviceName,
      stack: info.stack || undefined,
    });
  });

  constructor() {
    const isProd = this.isProd;
    this.logger = createLogger({
      level: isProd ? 'info' : 'debug',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        splat(),
        errors({ stack: true }),
        this.jsonFormat,
      ),
      transports: [
        new transports.DailyRotateFile({
          level: 'info',
          dirname: 'logs',
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d',
        }),
        new transports.DailyRotateFile({
          level: 'error',
          dirname: 'logs',
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
      exceptionHandlers: [
        new transports.DailyRotateFile({
          dirname: 'logs',
          filename: 'exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
      rejectionHandlers: [
        new (transports as any).DailyRotateFile({
          dirname: 'logs',
          filename: 'rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }
  error(message: string, trace: string, context?: string) {
    this.logger.error(message, {
      context: context || this.context,
      stack: trace,
    });
  }
  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }
  debug(message: string, context?: string, ...optionalParams: any[]) {
    this.logger.debug(message, {
      context: context || this.context,
      optionalParams,
    });
  }
  verbose(message: string, context?: string, ...optionalParams: any[]) {
    this.logger.verbose(message, {
      context: context || this.context,
      optionalParams,
    });
  }
}
