import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UrlModule } from './url/url.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisService } from './redis/redis.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AllExceptionsFilter } from './exception/globalException';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './cron.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL,
    }),

    MongooseModule.forRoot(process.env.MONGODB_URL!),

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
    RedisService,
    AllExceptionsFilter,
  ],
})
export class AppModule {}
