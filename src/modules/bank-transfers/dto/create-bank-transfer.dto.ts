import { IsNotEmpty, IsNumberString, IsString, IsUUID } from 'class-validator';

export class CreateBankTransferDto {
  @IsUUID()
  bankAccountId: string;

  @IsNumberString()
  amount: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}