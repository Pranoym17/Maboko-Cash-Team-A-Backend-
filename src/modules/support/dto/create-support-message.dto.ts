import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSupportMessageDto {
  @IsString()
  @MinLength(1)
  message: string;

  @IsOptional()
  @IsBoolean()
  isInternalNote?: boolean;
}
