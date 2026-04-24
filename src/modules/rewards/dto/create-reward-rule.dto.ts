import { IsBoolean, IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { RewardApprovalMode } from '../enums/reward-approval-mode.enum';
import { RewardTriggerType } from '../enums/reward-trigger-type.enum';

export class CreateRewardRuleDto {
  @IsString()
  name: string;

  @IsEnum(RewardTriggerType)
  triggerType: RewardTriggerType;

  @IsNumberString()
  rewardAmountCDF: string;

  @IsOptional()
  milestoneCount?: number;

  @IsOptional()
  @IsEnum(RewardApprovalMode)
  approvalMode?: RewardApprovalMode;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;
}
