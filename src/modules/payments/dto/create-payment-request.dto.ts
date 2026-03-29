import { IsNumber, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsUUID()
  recipientUserId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  currency?: string;
}
