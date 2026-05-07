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
import { TransactionStatus } from './enums/transaction-status.enum';
import { ReferralsService } from '../referrals/referrals.service';
import { normalizeDrcPhoneNumber } from '../../common/utils/phone.util';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly referralsService: ReferralsService,
  ) {}

  async createPeerToPeerTransfer(
    senderUserId: string,
    createTransferDto: CreateTransferDto,
  ) {
    const { receiverUserId, amount, description } = createTransferDto;

    const numericAmount = Number(amount);

    if (numericAmount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    if (senderUserId === receiverUserId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    let savedTransaction: Transaction | undefined;

    try {
      return await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const walletRepo = manager.getRepository(Wallet);
        const txRepo = manager.getRepository(Transaction);
        const ledgerRepo = manager.getRepository(LedgerEntry);
        const walletTxRepo = manager.getRepository(WalletTransaction);

        const sender = await userRepo.findOne({
          where: { id: senderUserId },
          relations: ['wallet'],
        });

        const receiver = await userRepo.findOne({
          where: { id: receiverUserId },
          relations: ['wallet'],
        });

        if (!sender || !receiver) {
          throw new NotFoundException('User not found');
        }

        if (!sender.wallet) {
          throw new NotFoundException('Sender wallet not found');
        }

        if (!receiver.wallet) {
          throw new NotFoundException('Receiver wallet not found');
        }

        const senderWallet = sender.wallet;
        const receiverWallet = receiver.wallet;

        const senderBalance = Number(senderWallet.balance);
        const receiverBalance = Number(receiverWallet.balance);

        if (senderBalance < numericAmount) {
          throw new BadRequestException('Insufficient balance');
        }

        const reference = `TX-${Date.now()}`;

        const transaction = txRepo.create({
          reference,
          senderUserId,
          receiverUserId,
          amount: numericAmount.toFixed(2),
          currency: 'CDF',
          status: TransactionStatus.PENDING,
          description: description ?? 'Transfer',
          type: 'peer_to_peer_transfer',
        });

        savedTransaction = await txRepo.save(transaction);

        // ledger entries
        await ledgerRepo.save([
          ledgerRepo.create({
            transaction: savedTransaction,
            wallet: senderWallet,
            entryType: LedgerEntryType.DEBIT,
            amount: numericAmount.toFixed(2),
            currency: 'CDF',
          }),
          ledgerRepo.create({
            transaction: savedTransaction,
            wallet: receiverWallet,
            entryType: LedgerEntryType.CREDIT,
            amount: numericAmount.toFixed(2),
            currency: 'CDF',
          }),
        ]);

        // update balances
        senderWallet.balance = (senderBalance - numericAmount).toFixed(2);
        receiverWallet.balance = (receiverBalance + numericAmount).toFixed(2);

        await walletRepo.save(senderWallet);
        await walletRepo.save(receiverWallet);

        // wallet history
        await walletTxRepo.save([
          walletTxRepo.create({
            wallet: senderWallet,
            type: WalletTransactionType.TRANSFER_OUT,
            status: WalletTransactionStatus.COMPLETED,
            amount: numericAmount.toFixed(2),
            currency: 'CDF',
            balanceBefore: senderBalance.toFixed(2),
            balanceAfter: senderWallet.balance,
          }),
          walletTxRepo.create({
            wallet: receiverWallet,
            type: WalletTransactionType.TRANSFER_IN,
            status: WalletTransactionStatus.COMPLETED,
            amount: numericAmount.toFixed(2),
            currency: 'CDF',
            balanceBefore: receiverBalance.toFixed(2),
            balanceAfter: receiverWallet.balance,
          }),
        ]);

        savedTransaction.status = TransactionStatus.COMPLETED;
        await txRepo.save(savedTransaction);

        await this.referralsService.markReferralActiveByTransaction(
          receiverUserId,
        );

        return {
          message: 'Transfer successful',
          transaction: savedTransaction,
        };
      });
    } catch (error) {
      if (savedTransaction) {
        await this.transactionsRepository.update(savedTransaction.id, {
          status: TransactionStatus.FAILED,
        });
      }
      throw error;
    }
  }

  async reverseTransaction(id: string) {
    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(Transaction);
      const walletRepo = manager.getRepository(Wallet);
      const ledgerRepo = manager.getRepository(LedgerEntry);

      const tx = await txRepo.findOne({ where: { id } });

      if (!tx) throw new NotFoundException('Transaction not found');

      if (tx.status === TransactionStatus.REVERSED) {
        throw new BadRequestException('Already reversed');
      }

      const senderWallet = await walletRepo.findOne({
        where: { user: { id: tx.senderUserId } },
        relations: ['user'],
      });

      const receiverWallet = await walletRepo.findOne({
        where: { user: { id: tx.receiverUserId } },
        relations: ['user'],
      });

      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      if (!receiverWallet) {
        throw new NotFoundException('Receiver wallet not found');
      }

      const amount = Number(tx.amount);

      senderWallet.balance = (Number(senderWallet.balance) + amount).toFixed(2);

      receiverWallet.balance = (
        Number(receiverWallet.balance) - amount
      ).toFixed(2);

      await walletRepo.save(senderWallet);
      await walletRepo.save(receiverWallet);

      await ledgerRepo.save([
        ledgerRepo.create({
          wallet: senderWallet,
          entryType: LedgerEntryType.CREDIT,
          amount: tx.amount,
          transaction: tx,
        }),
        ledgerRepo.create({
          wallet: receiverWallet,
          entryType: LedgerEntryType.DEBIT,
          amount: tx.amount,
          transaction: tx,
        }),
      ]);

      tx.status = TransactionStatus.REVERSED;
      await txRepo.save(tx);

      return { message: 'Transaction reversed' };
    });
  }

  async getAllTransactions() {
    return this.transactionsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async createPeerToPeerTransferByRecipientPhone(
    senderUserId: string,
    receiverPhoneNumber: string,
    amount: string,
    description?: string,
  ) {
    const receiver = await this.dataSource.getRepository(User).findOne({
      where: { phoneNumber: normalizeDrcPhoneNumber(receiverPhoneNumber) },
    });

    if (!receiver) {
      throw new NotFoundException('Recipient not found');
    }

    return this.createPeerToPeerTransfer(senderUserId, {
      receiverUserId: receiver.id,
      amount,
      description,
    });
  }

  async getTransactionsForUser(userId: string) {
    return this.transactionsRepository.find({
      where: [{ senderUserId: userId }, { receiverUserId: userId }],
      order: { createdAt: 'DESC' },
    });
  }

  async getTransactionById(id: string) {
    const tx = await this.transactionsRepository.findOne({
      where: { id },
    });

    if (!tx) throw new NotFoundException('Not found');
    return tx;
  }

  async getTransactionForUser(userId: string, id: string) {
    const tx = await this.transactionsRepository.findOne({
      where: [
        { id, senderUserId: userId },
        { id, receiverUserId: userId },
      ],
    });

    if (!tx) throw new NotFoundException('Not found');
    return tx;
  }
}
