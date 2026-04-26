import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
} from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "+22047658737" })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: "john.doe@example.com" })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
