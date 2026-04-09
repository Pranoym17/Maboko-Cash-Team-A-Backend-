import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileMoneyController } from './mobile-money.controller';
import { MobileMoneyService } from './mobile-money.service';
import { MobileMoneyTransaction } from './entities/mobile-money-transaction.entity';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MobileMoneyTransaction,
      User,
      Wallet,
      WalletTransaction,
      Transaction,
      LedgerEntry,
    ]),
  ],
  controllers: [MobileMoneyController],
  providers: [MobileMoneyService],
})
export class MobileMoneyModule {}