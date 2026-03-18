import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FxController } from './fx.controller';
import { FxService } from './fx.service';
import { FxRate } from './entities/fx-rate.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FxRate,
      Wallet,
      WalletTransaction,
      Transaction,
      LedgerEntry,
      User,
    ]),
  ],
  controllers: [FxController],
  providers: [FxService],
  exports: [FxService],
})
export class FxModule {}