import { IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from './admin-list-query.dto';

export class AdminMarketplaceQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  categoryCode?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  visibility?: string;
}
