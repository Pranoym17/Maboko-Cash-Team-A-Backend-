import { IsIn, IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from './admin-list-query.dto';

export class AdminUsersQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
