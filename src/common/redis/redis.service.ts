import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}
  async getCache(key: string) {
    const cachedData = await this.redis.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  }
  async setCache(key: string, value: any, ttlInSeconds: number) {
    await this.redis.set(key, JSON.stringify(value));
    if (ttlInSeconds) {
      await this.redis.expire(key, ttlInSeconds);
    }
  }

  async clearCache() {
    await this.redis.flushall();
  }
}
