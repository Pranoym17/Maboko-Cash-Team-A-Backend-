import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MobileMoneyTransaction } from './entities/mobile-money-transaction.entity';
import { MobileMoneyDepositDto } from './dto/mobile-money-deposit.dto';
import { MobileMoneyWithdrawDto } from './dto/mobile-money-withdraw.dto';
import { MobileMoneyCallbackDto } from './dto/mobile-money-callback.dto';
import { MobileMoneyStatus } from './enums/mobile-money-status.enum';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { WalletTransactionStatus } from '../wallets/enums/wallet-transaction-status.enum';
import { WalletTransactionType } from '../wallets/enums/wallet-transaction-type.enum';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionStatus } from '../transactions/enums/transaction-status.enum';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { LedgerEntryType } from '../ledger/enums/ledger-entry-type.enum';

@Injectable()
export class MobileMoneyService {
  constructor(
    @InjectRepository(MobileMoneyTransaction)
    private readonly mobileMoneyRepo: Repository<MobileMoneyTransaction>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createDeposit(userId: string, dto: MobileMoneyDepositDto) {
    const externalReference = `MM-DEP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const record = this.mobileMoneyRepo.create({
      userId,
      provider: dto.provider,
      phoneNumber: dto.phoneNumber,
      amount: Number(dto.amount).toFixed(2),
      currency: 'CDF',
      type: 'deposit',
      status: MobileMoneyStatus.PENDING,
      externalReference,
      description: dto.description ?? 'Simulated mobile money deposit',
    });

    return this.mobileMoneyRepo.save(record);
  }

  async createWithdrawal(userId: string, dto: MobileMoneyWithdrawDto) {
    const externalReference = `MM-WDR-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const record = this.mobileMoneyRepo.create({
      userId,
      provider: dto.provider,
      phoneNumber: dto.phoneNumber,
      amount: Number(dto.amount).toFixed(2),
      currency: 'CDF',
      type: 'withdrawal',
      status: MobileMoneyStatus.PENDING,
      externalReference,
      description: dto.description ?? 'Simulated mobile money withdrawal',
    });

    return this.mobileMoneyRepo.save(record);
  }

  async handleCallback(dto: MobileMoneyCallbackDto) {
    const mmTx = await this.mobileMoneyRepo.findOne({
      where: { externalReference: dto.externalReference },
    });

    if (!mmTx) {
      throw new NotFoundException('Mobile money transaction not found');
    }

    if (mmTx.status === MobileMoneyStatus.COMPLETED) {
      throw new BadRequestException('Mobile money transaction already completed');
    }

    if (dto.status === MobileMoneyStatus.FAILED) {
      mmTx.status = MobileMoneyStatus.FAILED;
      mmTx.callbackMessage = dto.message;
      return this.mobileMoneyRepo.save(mmTx);
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const walletRepo = manager.getRepository(Wallet);
      const walletTxRepo = manager.getRepository(WalletTransaction);
      const txRepo = manager.getRepository(Transaction);
      const ledgerRepo = manager.getRepository(LedgerEntry);
      const mmRepo = manager.getRepository(MobileMoneyTransaction);

      const user = await userRepo.findOne({
        where: { id: mmTx.userId },
        relations: ['wallet'],
      });

      if (!user || !user.wallet) {
        throw new NotFoundException('User wallet not found');
      }

      const wallet = user.wallet;
      const amount = Number(mmTx.amount);
      const balanceBefore = Number(wallet.balance);

      if (mmTx.type === 'withdrawal' && balanceBefore < amount) {
        mmTx.status = MobileMoneyStatus.FAILED;
        mmTx.callbackMessage = 'Insufficient wallet balance';
        await mmRepo.save(mmTx);
        throw new BadRequestException('Insufficient wallet balance');
      }

      const isDeposit = mmTx.type === 'deposit';
      const balanceAfter = isDeposit
        ? balanceBefore + amount
        : balanceBefore - amount;

      const transaction = txRepo.create({
        reference: mmTx.externalReference,
        senderUserId: user.id,
        receiverUserId: user.id,
        amount: amount.toFixed(2),
        currency: 'CDF',
        status: TransactionStatus.COMPLETED,
        description: mmTx.description,
        type: isDeposit ? 'mobile_money_deposit' : 'mobile_money_withdrawal',
      });

      const savedTx = await txRepo.save(transaction);

      const ledgerEntry = ledgerRepo.create({
        transaction: savedTx,
        wallet,
        entryType: isDeposit ? LedgerEntryType.CREDIT : LedgerEntryType.DEBIT,
        amount: amount.toFixed(2),
        currency: 'CDF',
        description: mmTx.description,
      });

      await ledgerRepo.save(ledgerEntry);

      wallet.balance = balanceAfter.toFixed(2);
      await walletRepo.save(wallet);

      const walletTx = walletTxRepo.create({
        wallet,
        type: isDeposit
          ? WalletTransactionType.CREDIT
          : WalletTransactionType.DEBIT,
        status: WalletTransactionStatus.COMPLETED,
        amount: amount.toFixed(2),
        currency: 'CDF',
        description: mmTx.description,
        reference: `${mmTx.externalReference}-WALLET`,
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
      });

      await walletTxRepo.save(walletTx);

      mmTx.status = MobileMoneyStatus.COMPLETED;
      mmTx.callbackMessage = dto.message;
      await mmRepo.save(mmTx);

      return {
        message: 'Mobile money callback processed successfully',
        mobileMoneyTransaction: mmTx,
        transaction: savedTx,
        wallet: {
          walletId: wallet.id,
          balanceBefore: balanceBefore.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
        },
      };
    });
  }

  async listMyTransactions(userId: string) {
    return this.mobileMoneyRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}