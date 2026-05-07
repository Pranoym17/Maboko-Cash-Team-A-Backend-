import { IsOptional, IsString } from 'class-validator';

export class UssdRequestDto {
  @IsOptional()
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  serviceCode?: string;

  @IsOptional()
  @IsString()
  text?: string;
}
