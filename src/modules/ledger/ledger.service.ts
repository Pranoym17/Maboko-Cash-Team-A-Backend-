import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntriesRepository: Repository<LedgerEntry>,
  ) {}

  async getWalletLedgerEntries(walletId: string) {
    return this.ledgerEntriesRepository.find({
      where: { wallet: { id: walletId } },
      relations: ['wallet', 'transaction'],
      order: { createdAt: 'DESC' },
    });
  }

  async calculateWalletBalanceFromLedger(walletId: string) {
    const entries = await this.ledgerEntriesRepository.find({
      where: { wallet: { id: walletId } },
      relations: ['wallet'],
    });

    if (!entries) {
      throw new NotFoundException('Wallet ledger entries not found');
    }

    let balance = 0;

    for (const entry of entries) {
      const amount = Number(entry.amount);

      if (entry.entryType === 'credit') {
        balance += amount;
      } else if (entry.entryType === 'debit') {
        balance -= amount;
      }
    }

    return {
      walletId,
      calculatedBalance: balance.toFixed(2),
      currency: 'CDF',
      entryCount: entries.length,
    };
  }
}