import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}
  async getCache(key: string) {
    const data = await this.redis.get(key);
    return { data };
  }
  async setCache(key: string, value: any) {
    await this.redis.set(key, value);
  }
}
