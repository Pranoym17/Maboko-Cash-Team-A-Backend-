import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAdminUserProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
