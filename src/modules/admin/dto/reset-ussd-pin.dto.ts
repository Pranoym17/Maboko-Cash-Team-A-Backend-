import { IsNumberString, Length } from 'class-validator';

export class ResetUssdPinDto {
  @IsNumberString()
  @Length(4, 6)
  ussdPin: string;
}
