import { IsString } from 'class-validator';

export class ScanPaymentRequestQRDto {
  @IsString()
  qrCodeData: string;
}
