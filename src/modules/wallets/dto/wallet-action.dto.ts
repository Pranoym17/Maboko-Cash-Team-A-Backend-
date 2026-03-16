import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class WalletActionDto {
  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}