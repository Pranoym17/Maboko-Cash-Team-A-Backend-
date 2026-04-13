import { IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from './admin-list-query.dto';

export class AdminBankQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
