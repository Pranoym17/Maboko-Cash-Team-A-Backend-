import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MobileMoneyProvider } from '../enums/mobile-money-provider.enum';
import { MobileMoneyStatus } from '../enums/mobile-money-status.enum';

@Entity('mobile_money_transactions')
export class MobileMoneyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: MobileMoneyProvider,
  })
  provider: MobileMoneyProvider;

  @Column()
  phoneNumber: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ default: 'CDF' })
  currency: string;

  @Column()
  type: string; // deposit / withdrawal

  @Column({
    type: 'enum',
    enum: MobileMoneyStatus,
    default: MobileMoneyStatus.PENDING,
  })
  status: MobileMoneyStatus;

  @Column({ unique: true })
  externalReference: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  callbackMessage?: string;

  @CreateDateColumn()
  createdAt: Date;
}