import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService) => ({
  type: 'postgres' as const,
  host: configService.get<string>('DB_HOST'),
  port: Number(configService.get<string>('DB_PORT')),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  autoLoadEntities: true,
  synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
  migrationsRun: configService.get<string>('DB_MIGRATIONS_RUN') !== 'false',
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  ...(configService.get<string>('DB_SSL') === 'true' && {
    ssl: { rejectUnauthorized: false },
  }),
});
