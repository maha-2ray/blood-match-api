import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from "class-validator";
import { UserRole } from "../../users/user.entity";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterStartDto {
  @ApiProperty({ example: "+2204567823" })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ example: "You@example.com" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
