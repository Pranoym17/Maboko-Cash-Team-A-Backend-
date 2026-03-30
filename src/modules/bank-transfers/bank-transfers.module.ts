import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankTransfersController } from './bank-transfers.controller';
import { BankTransfersService } from './bank-transfers.service';
import { BankAccount } from './entities/bank-account.entity';
import { BankTransfer } from './entities/bank-transfer.entity';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankAccount,
      BankTransfer,
      User,
      Wallet,
      WalletTransaction,
      Transaction,
      LedgerEntry,
    ]),
  ],
  controllers: [BankTransfersController],
  providers: [BankTransfersService],
})
export class BankTransfersModule {}