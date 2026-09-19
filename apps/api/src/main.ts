import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionsFilter } from './common/filters/http-exception.filter.js';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe.js';
import { TransformInterceptor } from './common/filters/transform.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser.default());
  app.enableCors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionsFilter());
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap()
  .then(() => {
    console.log('Server is running on port', process.env.PORT ?? 3001);
  })
  .catch((error) => {
    console.error('Error starting server:', error);
  });
