import { Injectable } from '@nestjs/common';
import { RedisService } from './common/redis/redis.service';
import { WinstonLogger } from './common/logger/winston.logger';

@Injectable()
export class AppService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: WinstonLogger,
  ) {}
  getHello(): string {
    const base = process.env.BASE;
    return `Hello World Igashi from ${base}!`;
  }
  async testCache() {
    // await this.redisService.clearCache();
    // Get the value from the cache
    const value = await this.redisService.getCache('test_key');
    if (value !== null && value !== undefined) {
      this.logger.log('Cache hit for test_key');
      return JSON.stringify(value);
    }
    // If not found, set the value in the cache with a TTL of 360 seconds
    await this.redisService.setCache('test_key', 'test_value', 360);
    this.logger.log('New cache value set for test_key');

    return JSON.stringify('fresh data');
  }
}
