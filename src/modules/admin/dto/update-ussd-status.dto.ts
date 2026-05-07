import { IsBoolean } from 'class-validator';

export class UpdateUssdStatusDto {
  @IsBoolean()
  ussdEnabled: boolean;
}
