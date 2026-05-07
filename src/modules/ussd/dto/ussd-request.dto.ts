import { IsOptional, IsString } from 'class-validator';

export class UssdRequestDto {
  @IsString()
  sessionId: string;

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  serviceCode?: string;

  @IsOptional()
  @IsString()
  text?: string;
}
