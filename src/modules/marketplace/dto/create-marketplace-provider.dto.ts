import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMarketplaceProviderDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  categoryCode: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  integrationType: string;

  @IsOptional()
  @IsString()
  apiBaseUrl?: string;

  @IsOptional()
  @IsString()
  authType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsAccountLinking?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  averageConfirmationSeconds?: number;
}
