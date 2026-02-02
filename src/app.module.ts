import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database.module';
import { QueueModule } from './modules/queue.module';
import { ReceiptModule } from './modules/receipt.module';
import { AuthModule } from './modules/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import {
  databaseConfig,
  cloudinaryConfig,
  emailConfig,
  redisConfig,
  jwtConfig,
} from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        cloudinaryConfig,
        emailConfig,
        redisConfig,
        jwtConfig,
      ],
    }),
    DatabaseModule,
    QueueModule,
    ReceiptModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
