import { IsOptional, IsString } from 'class-validator';

export class UpdateReferralStatusDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
