import { IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from './admin-list-query.dto';

export class AdminSupportQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
