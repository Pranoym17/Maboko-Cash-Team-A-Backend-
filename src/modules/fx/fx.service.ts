import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { DataSource, Repository } from 'typeorm';
import { FxRate } from './entities/fx-rate.entity';
import { UpdateFxRateDto } from './dto/update-fx-rate.dto';
import { FxDepositDto } from './dto/fx-deposit.dto';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { WalletTransactionStatus } from '../wallets/enums/wallet-transaction-status.enum';
import { WalletTransactionType } from '../wallets/enums/wallet-transaction-type.enum';
import { Transaction } from '../transactions/entities/transaction.entity';
import { LedgerEntry } from '../ledger/entities/ledger-entry.entity';
import { LedgerEntryType } from '../ledger/enums/ledger-entry-type.enum';
import { User } from '../users/entities/user.entity';
import { TransactionStatus } from '../transactions/enums/transaction-status.enum';
import { generateReference } from '../../common/utils/reference.util';

interface ExchangeRateApiResponse {
  result: string;
  conversion_rates?: Record<string, number>;
  time_last_update_utc?: string;
  time_next_update_utc?: string;
}
@Injectable()
export class FxService {
  constructor(
    @InjectRepository(FxRate)
    private readonly fxRatesRepository: Repository<FxRate>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private normalize(code: string): string {
    return code.trim().toUpperCase();
  }

  async listRates() {
    return this.fxRatesRepository.find({
      order: { baseCurrency: 'ASC' },
    });
  }

  async getRate(baseCurrency: string, quoteCurrency = 'CDF') {
    const base = this.normalize(baseCurrency);
    const quote = this.normalize(quoteCurrency);

    const maxAgeMinutes = Number(
      this.configService.get<string>('FX_MAX_AGE_MINUTES') ?? '60',
    );

    const existing = await this.fxRatesRepository.findOne({
      where: { baseCurrency: base, quoteCurrency: quote },
    });

    if (existing) {
      const ageMs = Date.now() - new Date(existing.fetchedAt).getTime();
      if (ageMs <= maxAgeMinutes * 60 * 1000) {
        return existing;
      }
    }

    return this.fetchAndStoreRate(base, quote);
  }

  async manuallyUpdateRate(dto: UpdateFxRateDto) {
    const base = this.normalize(dto.baseCurrency);
    const quote = this.normalize(dto.quoteCurrency ?? 'CDF');

    let row = await this.fxRatesRepository.findOne({
      where: { baseCurrency: base, quoteCurrency: quote },
    });

    if (!row) {
      row = this.fxRatesRepository.create({
        baseCurrency: base,
        quoteCurrency: quote,
      });
    }

    row.rate = Number(dto.rate).toFixed(6);
    row.provider =
      dto.provider ?? this.configService.get<string>('FX_PROVIDER') ?? 'Manual';
    row.isManual = true;
    row.fetchedAt = new Date();
    row.sourceLastUpdatedAt = new Date();
    row.sourceNextUpdateAt = null;

    return this.fxRatesRepository.save(row);
  }

  async convertToCdf(sourceCurrency: string, sourceAmount: string) {
    const base = this.normalize(sourceCurrency);
    const amount = Number(sourceAmount);

    if (amount <= 0) {
      throw new BadRequestException('Source amount must be greater than zero');
    }

    if (base === 'CDF') {
      return {
        sourceCurrency: 'CDF',
        sourceAmount: amount.toFixed(2),
        quoteCurrency: 'CDF',
        rate: '1.000000',
        convertedAmount: amount.toFixed(2),
        provider: 'Internal',
        asOf: new Date(),
      };
    }

    const rateRow = await this.getRate(base, 'CDF');
    const rate = Number(rateRow.rate);
    const convertedAmount = amount * rate;

    return {
      sourceCurrency: base,
      sourceAmount: amount.toFixed(2),
      quoteCurrency: 'CDF',
      rate: rate.toFixed(6),
      convertedAmount: convertedAmount.toFixed(2),
      provider: rateRow.provider,
      asOf: rateRow.fetchedAt,
      sourceLastUpdatedAt: rateRow.sourceLastUpdatedAt,
      sourceNextUpdateAt: rateRow.sourceNextUpdateAt,
    };
  }

  async createFxDeposit(userId: string, dto: FxDepositDto) {
    const conversion = await this.convertToCdf(
      dto.sourceCurrency,
      dto.sourceAmount,
    );

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const walletRepository = manager.getRepository(Wallet);
      const transactionRepository = manager.getRepository(Transaction);
      const ledgerEntryRepository = manager.getRepository(LedgerEntry);
      const walletTransactionRepository =
        manager.getRepository(WalletTransaction);

      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.isActive) {
        throw new BadRequestException('User account is inactive');
      }

      const wallet = await walletRepository
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('wallet.user', 'user')
        .where('user.id = :userId', { userId })
        .getOne();

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const balanceBefore = Number(wallet.balance);
      const convertedAmount = Number(conversion.convertedAmount);
      const balanceAfter = balanceBefore + convertedAmount;
      const reference = generateReference('FX');

      const tx = transactionRepository.create({
        reference,
        senderUserId: userId,
        receiverUserId: userId,
        amount: convertedAmount.toFixed(2),
        currency: 'CDF',
        status: TransactionStatus.COMPLETED,
        description:
          dto.description ?? `FX deposit from ${conversion.sourceCurrency}`,
        type: 'fx_deposit',
        sourceCurrency: conversion.sourceCurrency,
        sourceAmount: conversion.sourceAmount,
        fxRateSnapshot: conversion.rate,
        fxProvider: conversion.provider,
        fxTimestamp: new Date(conversion.asOf),
      });

      const savedTx = await transactionRepository.save(tx);

      const ledgerCredit = ledgerEntryRepository.create({
        transaction: savedTx,
        wallet,
        entryType: LedgerEntryType.CREDIT,
        amount: convertedAmount.toFixed(2),
        currency: 'CDF',
        description:
          dto.description ?? `FX deposit from ${conversion.sourceCurrency}`,
      });

      await ledgerEntryRepository.save(ledgerCredit);

      wallet.balance = balanceAfter.toFixed(2);
      await walletRepository.save(wallet);

      const walletTx = walletTransactionRepository.create({
        wallet,
        type: WalletTransactionType.CREDIT,
        status: WalletTransactionStatus.COMPLETED,
        amount: convertedAmount.toFixed(2),
        currency: 'CDF',
        description:
          dto.description ?? `FX deposit from ${conversion.sourceCurrency}`,
        reference: `${reference}-WALLET`,
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter.toFixed(2),
      });

      await walletTransactionRepository.save(walletTx);

      return {
        message: 'FX deposit completed successfully',
        transaction: savedTx,
        conversion,
        wallet: {
          walletId: wallet.id,
          balanceBefore: balanceBefore.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
        },
        ledgerEntriesCreated: 1,
      };
    });
  }

  @Cron('0 * * * *')
  async refreshConfiguredRatesHourly() {
    const raw =
      this.configService.get<string>('FX_REFRESH_CURRENCIES') ?? 'USD,EUR';
    const currencies = raw
      .split(',')
      .map((x) => this.normalize(x))
      .filter((x) => x && x !== 'CDF');

    for (const base of currencies) {
      try {
        await this.fetchAndStoreRate(base, 'CDF');
      } catch {
        // keep scheduler non-fatal
      }
    }
  }

  private async fetchAndStoreRate(baseCurrency: string, quoteCurrency = 'CDF') {
    const apiKey = this.configService.get<string>('FX_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('FX_API_KEY is not configured');
    }

    const base = this.normalize(baseCurrency);
    const quote = this.normalize(quoteCurrency);

    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`;
    const response = await axios.get<ExchangeRateApiResponse>(url);
    const data = response.data;

    if (data.result !== 'success') {
      throw new BadRequestException('Failed to fetch FX rate from provider');
    }

    const rate = data.conversion_rates?.[quote];
    if (!rate) {
      throw new BadRequestException(`Provider did not return ${base}/${quote}`);
    }

    let row = await this.fxRatesRepository.findOne({
      where: { baseCurrency: base, quoteCurrency: quote },
    });

    if (!row) {
      row = this.fxRatesRepository.create({
        baseCurrency: base,
        quoteCurrency: quote,
      });
    }

    row.rate = Number(rate).toFixed(6);
    row.provider =
      this.configService.get<string>('FX_PROVIDER') ?? 'ExchangeRate-API';
    row.isManual = false;
    row.fetchedAt = new Date();
    row.sourceLastUpdatedAt = data.time_last_update_utc
      ? new Date(data.time_last_update_utc)
      : null;
    row.sourceNextUpdateAt = data.time_next_update_utc
      ? new Date(data.time_next_update_utc)
      : null;

    return this.fxRatesRepository.save(row);
  }
}
