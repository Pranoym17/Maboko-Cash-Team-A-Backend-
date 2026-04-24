import { IsOptional, IsString } from 'class-validator';

export class UpdateRewardStatusDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
