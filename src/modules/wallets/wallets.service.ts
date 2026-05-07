import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { WalletTransactionType } from './enums/wallet-transaction-type.enum';
import { WalletTransactionStatus } from './enums/wallet-transaction-status.enum';
import { generateReference } from '../../common/utils/reference.util';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionsRepository: Repository<WalletTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  async getWalletByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getWalletBalance(userId: string) {
    const wallet = await this.getWalletByUserId(userId);

    return {
      walletId: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency,
    };
  }

  async getWalletHistory(userId: string) {
    const wallet = await this.getWalletByUserId(userId);

    const transactions = await this.walletTransactionsRepository.find({
      where: { wallet: { id: wallet.id } },
      order: { createdAt: 'DESC' },
      relations: ['wallet'],
    });

    return {
      walletId: wallet.id,
      currency: wallet.currency,
      balance: wallet.balance,
      transactions,
    };
  }

  async validateSufficientBalance(
    userId: string,
    amount: string,
  ): Promise<void> {
    const wallet = await this.getWalletByUserId(userId);

    const currentBalance = Number(wallet.balance);
    const requestedAmount = Number(amount);

    if (requestedAmount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    if (currentBalance < requestedAmount) {
      throw new BadRequestException('Insufficient wallet balance');
    }
  }

  async creditWallet(
    userId: string,
    amount: string,
    description?: string,
  ): Promise<WalletTransaction> {
    const numericAmount = Number(amount);

    if (numericAmount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const walletTxRepo = manager.getRepository(WalletTransaction);
      const wallet = await walletRepo
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('wallet.user', 'user')
        .where('user.id = :userId', { userId })
        .getOne();

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore + numericAmount;

      wallet.balance = balanceAfter.toFixed(2);
      await walletRepo.save(wallet);

      const transaction = walletTxRepo.create({
        wallet,
        type: WalletTransactionType.CREDIT,
        status: WalletTransactionStatus.COMPLETED,
        amount: numericAmount.toFixed(2),
        currency: 'CDF',
        description: description ?? 'Wallet credit',
        reference: generateReference('CREDIT'),
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
      });

      return walletTxRepo.save(transaction);
    });
  }

  async debitWallet(
    userId: string,
    amount: string,
    description?: string,
  ): Promise<WalletTransaction> {
    const numericAmount = Number(amount);

    if (numericAmount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const walletTxRepo = manager.getRepository(WalletTransaction);
      const wallet = await walletRepo
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('wallet.user', 'user')
        .where('user.id = :userId', { userId })
        .getOne();

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const balanceBefore = Number(wallet.balance);
      if (balanceBefore < numericAmount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const balanceAfter = balanceBefore - numericAmount;

      wallet.balance = balanceAfter.toFixed(2);
      await walletRepo.save(wallet);

      const transaction = walletTxRepo.create({
        wallet,
        type: WalletTransactionType.DEBIT,
        status: WalletTransactionStatus.COMPLETED,
        amount: numericAmount.toFixed(2),
        currency: 'CDF',
        description: description ?? 'Wallet debit',
        reference: generateReference('DEBIT'),
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
      });

      return walletTxRepo.save(transaction);
    });
  }
}
