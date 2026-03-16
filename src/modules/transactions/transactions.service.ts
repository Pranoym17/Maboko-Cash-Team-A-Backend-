import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { LedgerEntryType } from '../ledger/enums/ledger-entry-type.enum';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { WalletTransactionStatus } from '../wallets/enums/wallet-transaction-status.enum';
import { WalletTransactionType } from '../wallets/enums/wallet-transaction-type.enum';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createPeerToPeerTransfer(
    senderUserId: string,
    createTransferDto: CreateTransferDto,
  ) {
    const { receiverUserId, amount, description } = createTransferDto;

    const numericAmount = Number(amount);

    if (numericAmount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than zero');
    }

    if (senderUserId === receiverUserId) {
      throw new BadRequestException('Sender and receiver cannot be the same user');
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const walletRepository = manager.getRepository(Wallet);
      const transactionRepository = manager.getRepository(Transaction);
      const ledgerEntryRepository = manager.getRepository(LedgerEntry);
      const walletTransactionRepository = manager.getRepository(WalletTransaction);

      const sender = await userRepository.findOne({
        where: { id: senderUserId },
        relations: ['wallet'],
      });

      if (!sender) {
        throw new NotFoundException('Sender not found');
      }

      const receiver = await userRepository.findOne({
        where: { id: receiverUserId },
        relations: ['wallet'],
      });

      if (!receiver) {
        throw new NotFoundException('Receiver not found');
      }

      const senderWallet = await walletRepository.findOne({
        where: { id: sender.wallet.id },
        relations: ['user'],
      });

      const receiverWallet = await walletRepository.findOne({
        where: { id: receiver.wallet.id },
        relations: ['user'],
      });

      if (!senderWallet || !receiverWallet) {
        throw new NotFoundException('Sender or receiver wallet not found');
      }

      const senderBalanceBefore = Number(senderWallet.balance);
      const receiverBalanceBefore = Number(receiverWallet.balance);

      if (senderBalanceBefore < numericAmount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const senderBalanceAfter = senderBalanceBefore - numericAmount;
      const receiverBalanceAfter = receiverBalanceBefore + numericAmount;

      const reference = `TX-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      const transaction = transactionRepository.create({
        reference,
        senderUserId,
        receiverUserId,
        amount: numericAmount.toFixed(2),
        currency: 'CDF',
        status: 'completed',
        description: description ?? 'Peer-to-peer transfer',
        type: 'peer_to_peer_transfer',
      });

      const savedTransaction = await transactionRepository.save(transaction);

      const senderLedgerEntry = ledgerEntryRepository.create({
        transaction: savedTransaction,
        wallet: senderWallet,
        entryType: LedgerEntryType.DEBIT,
        amount: numericAmount.toFixed(2),
        currency: 'CDF',
        description: description ?? 'Transfer out',
      });

      const receiverLedgerEntry = ledgerEntryRepository.create({
        transaction: savedTransaction,
        wallet: receiverWallet,
        entryType: LedgerEntryType.CREDIT,
        amount: numericAmount.toFixed(2),
        currency: 'CDF',
        description: description ?? 'Transfer in',
      });

      await ledgerEntryRepository.save(senderLedgerEntry);
      await ledgerEntryRepository.save(receiverLedgerEntry);

      senderWallet.balance = senderBalanceAfter.toFixed(2);
      receiverWallet.balance = receiverBalanceAfter.toFixed(2);

      await walletRepository.save(senderWallet);
      await walletRepository.save(receiverWallet);

      const senderWalletTransaction = walletTransactionRepository.create({
        wallet: senderWallet,
        type: WalletTransactionType.TRANSFER_OUT,
        status: WalletTransactionStatus.COMPLETED,
        amount: numericAmount.toFixed(2),
        currency: 'CDF',
        description: description ?? 'Transfer sent',
        reference: `${reference}-OUT`,
        balanceBefore: senderBalanceBefore.toFixed(2),
        balanceAfter: senderBalanceAfter.toFixed(2),
      });

      const receiverWalletTransaction = walletTransactionRepository.create({
        wallet: receiverWallet,
        type: WalletTransactionType.TRANSFER_IN,
        status: WalletTransactionStatus.COMPLETED,
        amount: numericAmount.toFixed(2),
        currency: 'CDF',
        description: description ?? 'Transfer received',
        reference: `${reference}-IN`,
        balanceBefore: receiverBalanceBefore.toFixed(2),
        balanceAfter: receiverBalanceAfter.toFixed(2),
      });

      await walletTransactionRepository.save(senderWalletTransaction);
      await walletTransactionRepository.save(receiverWalletTransaction);

      return {
        message: 'Transfer completed successfully',
        transaction: savedTransaction,
        ledgerEntriesCreated: 2,
        senderWallet: {
          walletId: senderWallet.id,
          balanceBefore: senderBalanceBefore.toFixed(2),
          balanceAfter: senderBalanceAfter.toFixed(2),
        },
        receiverWallet: {
          walletId: receiverWallet.id,
          balanceBefore: receiverBalanceBefore.toFixed(2),
          balanceAfter: receiverBalanceAfter.toFixed(2),
        },
      };
    });
  }

  async getAllTransactions() {
    return this.transactionsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getTransactionById(id: string) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}