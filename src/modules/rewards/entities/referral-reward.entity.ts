import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RewardRule } from './reward-rule.entity';
import { RewardStatus } from '../enums/reward-status.enum';
import { RewardTriggerType } from '../enums/reward-trigger-type.enum';
import { Referral } from '../../referrals/entities/referral.entity';
import { User } from '../../users/entities/user.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { LedgerEntry } from '../../ledger/entities/ledger-entry.entity';

@Entity('referral_rewards')
export class ReferralReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Referral, { onDelete: 'CASCADE' })
  referral: Referral;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  referrer: User;

  @ManyToOne(() => RewardRule, { onDelete: 'CASCADE' })
  rule: RewardRule;

  @Column({
    type: 'enum',
    enum: RewardTriggerType,
  })
  rewardType: RewardTriggerType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amountCDF: string;

  @Column({
    type: 'enum',
    enum: RewardStatus,
    default: RewardStatus.PENDING,
  })
  status: RewardStatus;

  @Column({ type: 'varchar', nullable: true })
  approvedByAdminId: string | null;

  @Column({ type: 'varchar', nullable: true })
  rejectedByAdminId: string | null;

  @ManyToOne(() => Wallet, { nullable: true, onDelete: 'SET NULL' })
  creditedWallet: Wallet | null;

  @ManyToOne(() => LedgerEntry, { nullable: true, onDelete: 'SET NULL' })
  ledgerEntry: LedgerEntry | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
