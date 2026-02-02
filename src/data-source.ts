import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Support Supabase connection URI
const databaseUrl = process.env.DB_URL;

const dataSourceConfig = databaseUrl
  ? {
      type: 'postgres' as const,
      url: databaseUrl,
      entities: ['src/entities/**/*.entity.ts'],
      migrations: ['src/migrations/*.ts'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }
  : {
      type: 'postgres' as const,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'ecommerce_receipts',
      entities: ['src/entities/**/*.entity.ts'],
      migrations: ['src/migrations/*.ts'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development'
    };

export const AppDataSource = new DataSource(dataSourceConfig);
