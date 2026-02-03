import { Logger, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis.url') ? {
          url: configService.get('redis.url'),
        } : {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'receipt-generation',
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {
  constructor(configService: ConfigService) {
    const redisConfig = configService.get('redis.url') ? {
      url: configService.get('redis.url'),
    } : {
      host: configService.get('redis.host'),
      port: configService.get('redis.port'),
      password: configService.get('redis.password'),
    };
    Logger.log(
      `Redis config: ${JSON.stringify(redisConfig)}`,
      QueueModule.name,
    );
  }
}
