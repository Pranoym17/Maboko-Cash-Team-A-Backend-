import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { RewardRule } from './entities/reward-rule.entity';
import { ReferralReward } from './entities/referral-reward.entity';
import { Referral } from '../referrals/entities/referral.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { UsersModule } from '../users/users.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RewardRule,
      ReferralReward,
      Referral,
      Wallet,
      WalletTransaction,
      LedgerEntry,
    ]),
    UsersModule,
    forwardRef(() => ReferralsModule),
  ],
  providers: [RewardsService],
  controllers: [RewardsController],
  exports: [RewardsService, TypeOrmModule],
})
export class RewardsModule {}
