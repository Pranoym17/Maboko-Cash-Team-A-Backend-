import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { BankTransfer } from './entities/bank-transfer.entity';
import { LinkBankAccountDto } from './dto/link-bank-account.dto';
import { CreateBankTransferDto } from './dto/create-bank-transfer.dto';
import { BankTransferStatus } from './enums/bank-transfer-status.enum';
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
export class BankTransfersService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepo: Repository<BankAccount>,
    @InjectRepository(BankTransfer)
    private readonly bankTransferRepo: Repository<BankTransfer>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async linkBankAccount(userId: string, dto: LinkBankAccountDto) {
    const bankAccount = this.bankAccountRepo.create({
      userId,
      bankName: dto.bankName,
      accountNumber: dto.accountNumber,
      accountHolderName: dto.accountHolderName,
      isActive: true,
    });

    return this.bankAccountRepo.save(bankAccount);
  }

  async listMyBankAccounts(userId: string) {
    return this.bankAccountRepo.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createWalletToBankTransfer(userId: string, dto: CreateBankTransferDto) {
    const amount = Number(dto.amount);

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const walletRepo = manager.getRepository(Wallet);
      const walletTxRepo = manager.getRepository(WalletTransaction);
      const txRepo = manager.getRepository(Transaction);
      const ledgerRepo = manager.getRepository(LedgerEntry);
      const bankAccountRepo = manager.getRepository(BankAccount);
      const bankTransferRepo = manager.getRepository(BankTransfer);

      const user = await userRepo.findOne({
        where: { id: userId },
        relations: ['wallet'],
      });

      if (!user || !user.wallet) {
        throw new NotFoundException('User wallet not found');
      }

      const bankAccount = await bankAccountRepo.findOne({
        where: { id: dto.bankAccountId, userId, isActive: true },
      });

      if (!bankAccount) {
        throw new NotFoundException('Bank account not found');
      }

      const wallet = user.wallet;
      const balanceBefore = Number(wallet.balance);

      if (balanceBefore < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const balanceAfter = balanceBefore - amount;
      const reference = `BANK-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      const bankTransfer = bankTransferRepo.create({
        userId,
        bankAccountId: bankAccount.id,
        amount: amount.toFixed(2),
        currency: 'CDF',
        status: BankTransferStatus.COMPLETED,
        description: dto.description,
        reference,
      });

      const savedBankTransfer = await bankTransferRepo.save(bankTransfer);

      const transaction = txRepo.create({
        reference,
        senderUserId: userId,
        receiverUserId: userId,
        amount: amount.toFixed(2),
        currency: 'CDF',
        status: TransactionStatus.COMPLETED,
        description: dto.description,
        type: 'bank_transfer_withdrawal',
      });

      const savedTx = await txRepo.save(transaction);

      const ledgerEntry = ledgerRepo.create({
        transaction: savedTx,
        wallet,
        entryType: LedgerEntryType.DEBIT,
        amount: amount.toFixed(2),
        currency: 'CDF',
        description: dto.description,
      });

      await ledgerRepo.save(ledgerEntry);

      wallet.balance = balanceAfter.toFixed(2);
      await walletRepo.save(wallet);

      const walletTx = walletTxRepo.create({
        wallet,
        type: WalletTransactionType.DEBIT,
        status: WalletTransactionStatus.COMPLETED,
        amount: amount.toFixed(2),
        currency: 'CDF',
        description: dto.description,
        reference: `${reference}-WALLET`,
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
      });

      await walletTxRepo.save(walletTx);

      return {
        message: 'Bank transfer simulated successfully',
        bankTransfer: savedBankTransfer,
        transaction: savedTx,
        wallet: {
          walletId: wallet.id,
          balanceBefore: balanceBefore.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
        },
      };
    });
  }

  async listMyTransfers(userId: string) {
    return this.bankTransferRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}