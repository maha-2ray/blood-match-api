import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsPhoneNumber, IsString, Matches } from "class-validator";

export class SetPasscodeDto {
  @ApiProperty({ example: "+2207896453" })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: "2345636" })
  @IsString()
  @Matches(/^\d{4,6}$/)
  passcode!: string;
}
