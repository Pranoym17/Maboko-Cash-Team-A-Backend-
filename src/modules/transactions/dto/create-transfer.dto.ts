import { IsNotEmpty, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  receiverUserId: string;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}