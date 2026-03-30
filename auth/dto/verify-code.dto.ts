import { IsNotEmpty, IsPhoneNumber, IsString, Length } from "class-validator";

export class VerifyCodeDto {
  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
