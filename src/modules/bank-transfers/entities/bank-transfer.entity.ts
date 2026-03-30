import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BankTransferStatus } from '../enums/bank-transfer-status.enum';

@Entity('bank_transfers')
export class BankTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  bankAccountId: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ default: 'CDF' })
  currency: string;

  @Column({
    type: 'enum',
    enum: BankTransferStatus,
    default: BankTransferStatus.COMPLETED,
  })
  status: BankTransferStatus;

  @Column({ nullable: true })
  description?: string;

  @Column({ unique: true })
  reference: string;

  @CreateDateColumn()
  createdAt: Date;
}