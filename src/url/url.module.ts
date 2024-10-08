import { Module } from '@nestjs/common';
import { UrlController } from './url.controller.js';
import { UrlService } from './url.service.js';
import { MongooseModule } from '@nestjs/mongoose';
import { UrlSchema } from './entities/url-entity.dto.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisService } from '../redis/redis.service.js';

@Module({
  imports: [
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL,
    }),
    MongooseModule.forFeature([{ name: 'Url', schema: UrlSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [UrlController],
  providers: [UrlService, RedisService],
  exports: [UrlService],
})
export class UrlModule {}
