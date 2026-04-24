import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SupportConversationStatus } from '../enums/support-conversation-status.enum';

export class UpdateSupportStatusDto {
  @IsEnum(SupportConversationStatus)
  status: SupportConversationStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
