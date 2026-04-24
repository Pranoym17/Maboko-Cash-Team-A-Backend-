import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { MobileMoneyTransaction } from '../mobile-money/entities/mobile-money-transaction.entity';
import { BankTransfer } from '../bank-transfers/entities/bank-transfer.entity';
import { BankAccount } from '../bank-transfers/entities/bank-account.entity';
import { FxRate } from '../fx/entities/fx-rate.entity';
import { UsersModule } from '../users/users.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { MobileMoneyModule } from '../mobile-money/mobile-money.module';
import { Referral } from '../referrals/entities/referral.entity';
import { RewardRule } from '../rewards/entities/reward-rule.entity';
import { ReferralReward } from '../rewards/entities/referral-reward.entity';
import { ReferralsModule } from '../referrals/referrals.module';
import { RewardsModule } from '../rewards/rewards.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Wallet,
      WalletTransaction,
      Transaction,
      LedgerEntry,
      MobileMoneyTransaction,
      BankTransfer,
      BankAccount,
      FxRate,
      Referral,
      RewardRule,
      ReferralReward,
    ]),
    UsersModule,
    TransactionsModule,
    MobileMoneyModule,
    ReferralsModule,
    RewardsModule,
    AuditModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
