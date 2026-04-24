import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from './admin-list-query.dto';
import { ReferralStatus } from '../../referrals/enums/referral-status.enum';

export class AdminReferralsQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;

  @IsOptional()
  @IsBooleanString()
  fraudFlag?: string;
}
