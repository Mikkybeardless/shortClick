import { ConsoleLogger, Injectable, LoggerService } from '@nestjs/common';
import { WinstonLogger } from './winston.logger';

@Injectable()
export class CombinedLogger extends ConsoleLogger implements LoggerService {
  constructor(private readonly winstonLogger: WinstonLogger) {
    super();
  }

  log(message: string, context?: string) {
    super.log(message, context);
    this.winstonLogger.log(message, context);
  }
  error(message: string, trace: string, context?: string) {
    super.error(message, '', context);
    this.winstonLogger.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    super.warn(message, context);
    this.winstonLogger.warn(message, context);
  }
  debug(message: string, context?: string) {
    super.debug(message, context);
    this.winstonLogger.debug(message, context);
  }
  verbose(message: string, context?: string) {
    super.verbose(message, context);
    this.winstonLogger.verbose(message, context);
  }
}
