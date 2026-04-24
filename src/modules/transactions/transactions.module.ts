import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    ReferralsModule,
    TypeOrmModule.forFeature([
      Transaction,
      User,
      Wallet,
      LedgerEntry,
      WalletTransaction,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
