import { IsOptional, IsString } from 'class-validator';
import { AdminListQueryDto } from './admin-list-query.dto';

export class AdminWalletsQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;
}
