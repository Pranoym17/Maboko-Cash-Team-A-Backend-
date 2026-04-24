import { IsNumber, IsString, Min } from 'class-validator';

export class CreateMarketplaceDraftDto {
  @IsString()
  providerId: string;

  @IsString()
  serviceName: string;

  @IsString()
  reference: string;

  @IsNumber()
  @Min(1)
  amountCDF: number;
}
