import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class AppService {
  constructor(private redisService: RedisService) {}
  getHello(): string {
    const base = process.env.BASE;
    return `Hello World Igashi from ${base}!`;
  }
  async testCache() {
    // console.log('Cache Manager Instance:', this.redisService);
    // console.log(
    //   'Available Methods:',
    //   Object.getOwnPropertyNames(Object.getPrototypeOf(this.redisService)),
    // );

    await this.redisService.clearCache();
    // Get the value from the cache
    const value = await this.redisService.getCache('test_key');
    console.log(typeof value);
    if (value !== null && value !== undefined) {
      return JSON.stringify(value);
    }

    await this.redisService.setCache('test_key', 'test_value', 360);

    return JSON.stringify('fresh data');
  }
}
