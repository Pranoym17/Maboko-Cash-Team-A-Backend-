import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MobileMoneyStatus } from '../enums/mobile-money-status.enum';

export class MobileMoneyCallbackDto {
  @IsString()
  externalReference: string;

  @IsEnum(MobileMoneyStatus)
  status: MobileMoneyStatus;

  @IsOptional()
  @IsString()
  message?: string;
}