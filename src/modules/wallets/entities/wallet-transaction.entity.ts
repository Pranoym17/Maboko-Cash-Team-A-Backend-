import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { WalletTransactionType } from '../enums/wallet-transaction-type.enum';
import { WalletTransactionStatus } from '../enums/wallet-transaction-status.enum';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  wallet: Wallet;

  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

  @Column({
    type: 'enum',
    enum: WalletTransactionStatus,
    default: WalletTransactionStatus.COMPLETED,
  })
  status: WalletTransactionStatus;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ default: 'CDF' })
  currency: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, unique: true })
  reference: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  balanceBefore: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  balanceAfter: string;

  @CreateDateColumn()
  createdAt: Date;
}