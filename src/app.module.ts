import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database.module';
import { QueueModule } from './modules/queue.module';
import { ReceiptModule } from './modules/receipt.module';
import {
  databaseConfig,
  cloudinaryConfig,
  emailConfig,
  redisConfig,
} from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, cloudinaryConfig, emailConfig, redisConfig],
    }),
    DatabaseModule,
    QueueModule,
    ReceiptModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
