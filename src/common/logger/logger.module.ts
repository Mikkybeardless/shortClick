import { Global, Module } from '@nestjs/common';
import { CombinedLogger } from './combined.logger';
import { WinstonLogger } from './winston.logger';

@Global()
@Module({
  providers: [CombinedLogger, WinstonLogger],
  exports: [CombinedLogger, WinstonLogger],
})
export class LoggerModule {}
