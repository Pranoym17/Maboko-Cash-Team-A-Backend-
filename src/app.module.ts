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
import { TranslationModule } from './modules/translation/translation.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
    TranslationModule,
    ReferralsModule,
    RewardsModule,
    AuditModule,
  ],
})
export class AppModule {}
