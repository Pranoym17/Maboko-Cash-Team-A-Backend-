import { IsOptional, IsString } from 'class-validator';

export class UpdateSupportAssignmentDto {
  @IsOptional()
  @IsString()
  assignedAdminId?: string;
}
