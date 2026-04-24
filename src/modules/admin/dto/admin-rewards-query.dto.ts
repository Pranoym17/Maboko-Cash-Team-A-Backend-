import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from './admin-list-query.dto';
import { RewardStatus } from '../../rewards/enums/reward-status.enum';

export class AdminRewardsQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;
}
