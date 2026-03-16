import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { WalletTransactionType } from './enums/wallet-transaction-type.enum';
import { WalletTransactionStatus } from './enums/wallet-transaction-status.enum';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionsRepository: Repository<WalletTransaction>,
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

  async validateSufficientBalance(userId: string, amount: string): Promise<void> {
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
    const wallet = await this.getWalletByUserId(userId);

    const numericAmount = Number(amount);

    if (numericAmount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + numericAmount;

    wallet.balance = balanceAfter.toFixed(2);
    await this.walletsRepository.save(wallet);

    const transaction = this.walletTransactionsRepository.create({
      wallet,
      type: WalletTransactionType.CREDIT,
      status: WalletTransactionStatus.COMPLETED,
      amount: numericAmount.toFixed(2),
      currency: 'CDF',
      description: description ?? 'Wallet credit',
      reference: `CREDIT-${Date.now()}`,
      balanceBefore: balanceBefore.toFixed(2),
      balanceAfter: balanceAfter.toFixed(2),
    });

    return this.walletTransactionsRepository.save(transaction);
  }

  async debitWallet(
    userId: string,
    amount: string,
    description?: string,
  ): Promise<WalletTransaction> {
    await this.validateSufficientBalance(userId, amount);

    const wallet = await this.getWalletByUserId(userId);
    const numericAmount = Number(amount);

    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore - numericAmount;

    wallet.balance = balanceAfter.toFixed(2);
    await this.walletsRepository.save(wallet);

    const transaction = this.walletTransactionsRepository.create({
      wallet,
      type: WalletTransactionType.DEBIT,
      status: WalletTransactionStatus.COMPLETED,
      amount: numericAmount.toFixed(2),
      currency: 'CDF',
      description: description ?? 'Wallet debit',
      reference: `DEBIT-${Date.now()}`,
      balanceBefore: balanceBefore.toFixed(2),
      balanceAfter: balanceAfter.toFixed(2),
    });

    return this.walletTransactionsRepository.save(transaction);
  }
}