import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPhoneNumber, IsString, Length } from "class-validator";

export class VerifyCodeDto {
  @ApiProperty()
  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty()
  @IsString()
  @Length(6, 6)
  code!: string;
}
