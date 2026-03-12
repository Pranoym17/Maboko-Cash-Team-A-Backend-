import { IsString } from 'class-validator';

export class ScanQRCodeDto {
  @IsString()
  qrCodeData: string;
}
