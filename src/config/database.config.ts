import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  redisURI: process.env.REDIS_URL,
  mongoDBURI: process.env.MONGODB_URL,
}));
