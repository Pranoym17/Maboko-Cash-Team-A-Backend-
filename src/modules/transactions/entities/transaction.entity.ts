import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  senderUserId: string;

  @Column()
  receiverUserId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ default: 'CDF' })
  currency: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ default: 'peer_to_peer_transfer' })
  type: string;

  // FX snapshot fields
  @Column({ type: 'varchar', length: 3, nullable: true })
  sourceCurrency?: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  sourceAmount?: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  fxRateSnapshot?: string;

  @Column({ type: 'varchar', nullable: true })
  fxProvider?: string;

  @Column({ type: 'timestamptz', nullable: true })
  fxTimestamp?: Date;

  @CreateDateColumn()
  createdAt: Date;
}