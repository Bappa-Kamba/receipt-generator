import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpLogger } from './common/httpLogger.middleware';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { Logger } from '@nestjs/common';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.use(new HttpLogger().use);

  const config = new DocumentBuilder()
    .setTitle('E-Commerce Receipt Generator API')
    .setDescription('API for generating and managing e-commerce receipts')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('webhooks')
    .addTag('receipts')
    .addTag('orders')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
