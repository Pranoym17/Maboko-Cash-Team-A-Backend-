import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RewardApprovalMode } from '../enums/reward-approval-mode.enum';
import { RewardTriggerType } from '../enums/reward-trigger-type.enum';

@Entity('reward_rules')
export class RewardRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: RewardTriggerType,
  })
  triggerType: RewardTriggerType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  rewardAmountCDF: string;

  @Column({ type: 'int', nullable: true })
  milestoneCount: number | null;

  @Column({
    type: 'enum',
    enum: RewardApprovalMode,
    default: RewardApprovalMode.MANUAL,
  })
  approvalMode: RewardApprovalMode;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  createdByAdminId: string | null;

  @Column({ type: 'varchar', nullable: true })
  updatedByAdminId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
