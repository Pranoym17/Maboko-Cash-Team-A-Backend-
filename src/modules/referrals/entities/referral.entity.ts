import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ReferralStatus } from '../enums/referral-status.enum';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @Index()
  referrer: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @Index({ unique: true })
  referredUser: User;

  @Column()
  referralCodeUsed: string;

  @Column({ nullable: true })
  shareChannel: string | null;

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.REGISTERED,
  })
  @Index()
  status: ReferralStatus;

  @Column({ type: 'timestamptz' })
  registeredAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  firstValidTransactionAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  rewardEligibilityAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  rewardedAt: Date | null;

  @Column({ default: false })
  @Index()
  fraudFlag: boolean;

  @Column({ type: 'text', nullable: true })
  fraudReason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
