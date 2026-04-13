import { IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from './admin-list-query.dto';

export class AdminMobileMoneyQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
