import { IsOptional, IsString } from 'class-validator';

export class AdminMobileMoneyDecisionDto {
  @IsOptional()
  @IsString()
  message?: string;
}
