import { Module, Global } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global() // Make this module global
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('database.redisURI'),
      }),
    }),
  ],
  providers: [RedisService],
  exports: [RedisModule, RedisService],
})
export class GlobalRedisModule {}
