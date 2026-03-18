import { IsNotEmpty, IsNumberString, IsOptional, IsString, Length } from 'class-validator';

export class FxDepositDto {
  @IsString()
  @Length(3, 3)
  sourceCurrency: string;

  @IsNumberString()
  sourceAmount: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}