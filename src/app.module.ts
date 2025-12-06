import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UrlModule } from './modules/url/url.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './common/exception/globalException';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './cron.service';
import { LoggerModule } from './common/logger/logger.module';
import { AppConfigModule } from './config/config.module';
import { MongooseDatabaseModule } from './database/mongoose.module';
import { JwtGlobalModule } from './common/jwt/jwt.module';

@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    LoggerModule,
    ConfigModule.forRoot({ isGlobal: true }),
    JwtGlobalModule,
    MongooseDatabaseModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 60,
        limit: 10,
      },
    ]),
    AuthModule,
    UrlModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TasksService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AllExceptionsFilter,
  ],
})
export class AppModule {}
