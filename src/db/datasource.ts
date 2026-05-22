import dotenv from 'dotenv';
import path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config();

// Parse DATABASE_URL if provided (e.g., from Render)
const getDatabaseConfig = (): DataSourceOptions => {
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      synchronize: false,
      logging: false,
      entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, '/../migrations/*{.ts,.js}')],
    } as DataSourceOptions;
  }

  // Fallback to individual variables
  return {
    type: (process.env.DB_TYPE as any) || 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
    logging: false,
    entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],
    migrations: [path.join(__dirname, '/../migrations/*{.ts,.js}')],
  };
};

export const dataSourceOptions: DataSourceOptions = getDatabaseConfig();

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
