import { IsNotEmpty, IsPhoneNumber, IsString, Matches } from "class-validator";

export class SetPasscodeDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @Matches(/^\d{4,6}$/)
  passcode!: string;
}
