import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { SupportCategory } from '../enums/support-category.enum';
import { SupportPriority } from '../enums/support-priority.enum';

export class CreateSupportConversationDto {
  @IsString()
  @MinLength(3)
  subject: string;

  @IsOptional()
  @IsEnum(SupportCategory)
  category?: SupportCategory;

  @IsOptional()
  @IsEnum(SupportPriority)
  priority?: SupportPriority;

  @IsString()
  @MinLength(1)
  message: string;
}
