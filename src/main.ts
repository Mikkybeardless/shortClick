import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/exception/globalException';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { CombinedLogger } from './common/logger/combined.logger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 8000;
  const allExceptionsFilter = app.get(AllExceptionsFilter);

  // CORS Configuration
  const corsOptions: CorsOptions = {
    origin: configService.get<string>('app.corsOrigins')?.split(',') || [], // Allow requests from this origin
    credentials: true, // Allow cookies to be sent across domains
  };

  app.enableCors(corsOptions);
  app.useLogger(app.get(CombinedLogger));
  app.useGlobalFilters(allExceptionsFilter);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Short Clicks API')
    .setDescription('Short Clicks URL shortener API description')
    .setVersion('1.0')
    .addTag('url-shortener')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
}
bootstrap();
