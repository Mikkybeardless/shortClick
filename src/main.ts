import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './exception/globalException';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 8000;

  const allExceptionsFilter = app.get(AllExceptionsFilter);
  app.useGlobalFilters(allExceptionsFilter);

  const corsOptions: CorsOptions = {
    origin: ['http://localhost:3000', 'https://short-clicks-frontend.vercel.app'], // Allow requests from this origin
    credentials: true, // Allow cookies to be sent across domains
  };

  app.enableCors(corsOptions);
  await app.listen(port);
}
bootstrap();
