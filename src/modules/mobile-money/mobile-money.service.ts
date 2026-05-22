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
import { MobileMoneyProvider } from './enums/mobile-money-provider.enum';
import { MobileMoneyStatus } from './enums/mobile-money-status.enum';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { WalletTransactionStatus } from '../wallets/enums/wallet-transaction-status.enum';
import { WalletTransactionType } from '../wallets/enums/wallet-transaction-type.enum';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionStatus } from '../transactions/enums/transaction-status.enum';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { LedgerEntryType } from '../ledger/enums/ledger-entry-type.enum';
import { generateReference } from '../../common/utils/reference.util';
import { MpesaProvider } from './providers/mpesa.provider';
import { AirtelProvider } from './providers/airtel.provider';
import { OrangeProvider } from './providers/orange.provider';

@Injectable()
export class MobileMoneyService {
  constructor(
    @InjectRepository(MobileMoneyTransaction)
    private readonly mobileMoneyRepo: Repository<MobileMoneyTransaction>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly mpesaProvider: MpesaProvider,
    private readonly airtelProvider: AirtelProvider,
    private readonly orangeProvider: OrangeProvider,
  ) {}

  async createDeposit(userId: string, dto: MobileMoneyDepositDto) {
    const amount = Number(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const externalReference = generateReference('MM-DEP');

    let providerResponse: any;
    try {
      switch (dto.provider) {
        case MobileMoneyProvider.MPESA:
          providerResponse = await this.mpesaProvider.initiateDeposit(dto, externalReference);
          break;
        case MobileMoneyProvider.AIRTEL_MONEY:
          providerResponse = await this.airtelProvider.initiateDeposit(dto, externalReference);
          break;
        case MobileMoneyProvider.ORANGE_MONEY:
          providerResponse = await this.orangeProvider.initiateDeposit(dto, externalReference);
          break;
        default:
          throw new BadRequestException('Unsupported mobile money provider');
      }
    } catch (error: any) {
      throw new BadRequestException(`Provider API error: ${error.message}`);
    }

    const record = this.mobileMoneyRepo.create({
      userId,
      provider: dto.provider,
      phoneNumber: dto.phoneNumber,
      amount: amount.toFixed(2),
      currency: 'CDF',
      type: 'deposit',
      status: MobileMoneyStatus.PENDING,
      externalReference,
      description: dto.description ?? 'Mobile money deposit',
    });

    const savedRecord = await this.mobileMoneyRepo.save(record);

    // Auto-approve simulated deposits for demo purposes
    if (providerResponse?.simulated) {
      setTimeout(() => {
        this.handleCallback({
          externalReference,
          status: MobileMoneyStatus.COMPLETED,
          message: 'Simulated successful deposit',
        }).catch((err) => console.error('Simulated callback failed', err));
      }, 3000);
    }

    return savedRecord;
  }

  async createWithdrawal(userId: string, dto: MobileMoneyWithdrawDto) {
    const amount = Number(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const externalReference = generateReference('MM-WDR');

    let providerResponse: any;
    try {
      switch (dto.provider) {
        case MobileMoneyProvider.MPESA:
          providerResponse = await this.mpesaProvider.initiateWithdrawal(dto, externalReference);
          break;
        case MobileMoneyProvider.AIRTEL_MONEY:
          providerResponse = await this.airtelProvider.initiateWithdrawal(dto, externalReference);
          break;
        case MobileMoneyProvider.ORANGE_MONEY:
          providerResponse = await this.orangeProvider.initiateWithdrawal(dto, externalReference);
          break;
        default:
          throw new BadRequestException('Unsupported mobile money provider');
      }
    } catch (error: any) {
      throw new BadRequestException(`Provider API error: ${error.message}`);
    }

    const record = this.mobileMoneyRepo.create({
      userId,
      provider: dto.provider,
      phoneNumber: dto.phoneNumber,
      amount: amount.toFixed(2),
      currency: 'CDF',
      type: 'withdrawal',
      status: MobileMoneyStatus.PENDING,
      externalReference,
      description: dto.description ?? 'Mobile money withdrawal',
    });

    const savedRecord = await this.mobileMoneyRepo.save(record);

    // Auto-approve simulated withdrawals for demo purposes
    if (providerResponse?.simulated) {
      setTimeout(() => {
        this.handleCallback({
          externalReference,
          status: MobileMoneyStatus.COMPLETED,
          message: 'Simulated successful withdrawal',
        }).catch((err) => console.error('Simulated callback failed', err));
      }, 3000);
    }

    return savedRecord;
  }

  async handleCallback(dto: MobileMoneyCallbackDto) {
    const mmTx = await this.mobileMoneyRepo.findOne({
      where: { externalReference: dto.externalReference },
    });

    return this.processDecision(mmTx, dto.status, dto.message);
  }

  async listAllTransactions(filters: {
    status?: string;
    type?: string;
    userId?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const qb = this.mobileMoneyRepo.createQueryBuilder('mm');

    if (filters.status) {
      qb.andWhere('LOWER(mm.status) = LOWER(:status)', {
        status: filters.status,
      });
    }

    if (filters.type) {
      qb.andWhere('LOWER(mm.type) = LOWER(:type)', { type: filters.type });
    }

    if (filters.userId) {
      qb.andWhere('mm.userId = :userId', { userId: filters.userId });
    }

    if (filters.search) {
      qb.andWhere(
        '(CAST(mm.userId AS TEXT) ILIKE :search OR mm.externalReference ILIKE :search OR mm.phoneNumber ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('mm.createdAt', 'DESC');
    qb.skip((filters.page - 1) * filters.limit).take(filters.limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getTransactionById(id: string) {
    const mmTx = await this.mobileMoneyRepo.findOne({
      where: { id },
    });

    if (!mmTx) {
      throw new NotFoundException('Mobile money transaction not found');
    }

    return mmTx;
  }

  async approveById(id: string, message?: string) {
    const mmTx = await this.getTransactionById(id);
    return this.processDecision(mmTx, MobileMoneyStatus.COMPLETED, message);
  }

  async rejectById(id: string, message?: string) {
    const mmTx = await this.getTransactionById(id);
    return this.processDecision(mmTx, MobileMoneyStatus.FAILED, message);
  }

  private async processDecision(
    mmTx: MobileMoneyTransaction | null,
    status: MobileMoneyStatus,
    message?: string,
  ) {
    if (!mmTx) {
      throw new NotFoundException('Mobile money transaction not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const walletTxRepo = manager.getRepository(WalletTransaction);
      const txRepo = manager.getRepository(Transaction);
      const ledgerRepo = manager.getRepository(LedgerEntry);
      const mmRepo = manager.getRepository(MobileMoneyTransaction);

      const lockedMmTx = await mmRepo.findOne({
        where: { id: mmTx.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedMmTx) {
        throw new NotFoundException('Mobile money transaction not found');
      }

      if (
        lockedMmTx.status === MobileMoneyStatus.COMPLETED ||
        lockedMmTx.status === MobileMoneyStatus.FAILED
      ) {
        throw new BadRequestException(
          'Mobile money transaction already finalized',
        );
      }

      if (status === MobileMoneyStatus.FAILED) {
        lockedMmTx.status = MobileMoneyStatus.FAILED;
        lockedMmTx.callbackMessage = message;
        return mmRepo.save(lockedMmTx);
      }

      const wallet = await walletRepo
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('wallet.user', 'user')
        .where('user.id = :userId', { userId: lockedMmTx.userId })
        .getOne();

      if (!wallet || !wallet.user) {
        throw new NotFoundException('User wallet not found');
      }

      if (!wallet.user.isActive) {
        throw new BadRequestException('User account is inactive');
      }

      const amount = Number(lockedMmTx.amount);
      const balanceBefore = Number(wallet.balance);

      if (lockedMmTx.type === 'withdrawal' && balanceBefore < amount) {
        lockedMmTx.status = MobileMoneyStatus.FAILED;
        lockedMmTx.callbackMessage = 'Insufficient wallet balance';
        await mmRepo.save(lockedMmTx);
        throw new BadRequestException('Insufficient wallet balance');
      }

      const isDeposit = lockedMmTx.type === 'deposit';
      const balanceAfter = isDeposit
        ? balanceBefore + amount
        : balanceBefore - amount;

      const transaction = txRepo.create({
        reference: lockedMmTx.externalReference,
        senderUserId: wallet.user.id,
        receiverUserId: wallet.user.id,
        amount: amount.toFixed(2),
        currency: 'CDF',
        status: TransactionStatus.COMPLETED,
        description: lockedMmTx.description,
        type: isDeposit ? 'mobile_money_deposit' : 'mobile_money_withdrawal',
      });

      const savedTx = await txRepo.save(transaction);

      const ledgerEntry = ledgerRepo.create({
        transaction: savedTx,
        wallet,
        entryType: isDeposit ? LedgerEntryType.CREDIT : LedgerEntryType.DEBIT,
        amount: amount.toFixed(2),
        currency: 'CDF',
        description: lockedMmTx.description,
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
        description: lockedMmTx.description,
        reference: `${lockedMmTx.externalReference}-WALLET`,
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
      });

      await walletTxRepo.save(walletTx);

      lockedMmTx.status = MobileMoneyStatus.COMPLETED;
      lockedMmTx.callbackMessage = message;
      await mmRepo.save(lockedMmTx);

      return {
        message: 'Mobile money callback processed successfully',
        mobileMoneyTransaction: lockedMmTx,
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
