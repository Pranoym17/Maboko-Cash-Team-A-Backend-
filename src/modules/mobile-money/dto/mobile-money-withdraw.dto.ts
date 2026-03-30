import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';
import { MobileMoneyProvider } from '../enums/mobile-money-provider.enum';

export class MobileMoneyWithdrawDto {
  @IsEnum(MobileMoneyProvider)
  provider: MobileMoneyProvider;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  description?: string;
}