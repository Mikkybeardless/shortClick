import * as Joi from '@hapi/joi';

export const validationSchema = Joi.object({
  // General App Configurations
  CORS_ORIGINS: Joi.string().required(),
  PORT: Joi.number().default(8000),
  APP_PREFIX: Joi.string().default('/api'),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  BASE: Joi.string().required(),

  // Database and Redis Configuration
  MONGODB_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),

  // Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // weather API
  WEATHER_API_KEY: Joi.string().required(),
  WEATHER_API_URL: Joi.string().required(),

  // Resend Email Service
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM_EMAIL: Joi.string().email().required(),
});
