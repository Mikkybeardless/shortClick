import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  appName: process.env.APP_NAME,
  jwtSecret: process.env.JWT_SECRET,
  baseURI: process.env.BASE,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  port: parseInt(process.env.PORT || '8000', 10),
  appPrefix: process.env.APP_PREFIX || '/api',
  weatherAPIKey: process.env.WEATHER_API_KEY,
  weatherAPIURI: process.env.WEATHER_API_URL,
  corsOrigins: process.env.CORS_ORIGINS,
}));
