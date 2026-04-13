import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { FxModule } from './modules/fx/fx.module';
import { getDatabaseConfig } from './config/database.config';
import { MobileMoneyModule } from './modules/mobile-money/mobile-money.module';
import { BankTransfersModule } from './modules/bank-transfers/bank-transfers.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),
    UsersModule,
    AuthModule,
    WalletsModule,
    LedgerModule,
    TransactionsModule,
    FxModule,
    MobileMoneyModule,
    BankTransfersModule,
    AdminModule,
  ],
})
export class AppModule {}
