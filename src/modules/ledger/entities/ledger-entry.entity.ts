import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { LedgerEntryType } from '../enums/ledger-entry-type.enum';

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE', nullable: true })
  transaction: Transaction | null;

  @ManyToOne(() => Wallet, (wallet) => wallet.ledgerEntries, { onDelete: 'CASCADE' })
  wallet: Wallet;

  @Column({
    type: 'enum',
    enum: LedgerEntryType,
  })
  entryType: LedgerEntryType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ default: 'CDF' })
  currency: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
