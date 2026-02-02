import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Receipt } from '../entities/receipt.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseConfig = configService.get('database');
        
        // If URL is provided, use it directly
        if (databaseConfig.url) {
          return {
            type: 'postgres',
            url: databaseConfig.url,
            entities: [User, Customer, Order, OrderItem, Receipt],
            migrations: databaseConfig.migrations,
            synchronize: databaseConfig.synchronize,
            logging: databaseConfig.logging,
            ssl: databaseConfig.ssl,
          };
        }

        // Otherwise, use individual connection parameters
        return {
          type: 'postgres',
          host: databaseConfig.host,
          port: databaseConfig.port,
          username: databaseConfig.username,
          password: databaseConfig.password,
          database: databaseConfig.database,
          entities: [User, Customer, Order, OrderItem, Receipt],
          migrations: databaseConfig.migrations,
          synchronize: databaseConfig.synchronize,
          logging: databaseConfig.logging,
          ssl: databaseConfig.ssl,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Customer, Order, OrderItem, Receipt]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
