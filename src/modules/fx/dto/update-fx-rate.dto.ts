import { IsNotEmpty, IsNumberString, IsOptional, IsString, Length } from 'class-validator';

export class UpdateFxRateDto {
  @IsString()
  @Length(3, 3)
  baseCurrency: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  quoteCurrency?: string = 'CDF';

  @IsNumberString()
  rate: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  provider?: string;
}