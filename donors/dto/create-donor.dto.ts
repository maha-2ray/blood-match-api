import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsDateString,
} from "class-validator";
import { BloodType, Region, AvailabilityStatus } from "../donor.entity";

export class CreateDonorDto {
  @IsEnum(BloodType)
  @IsNotEmpty()
  bloodType!: BloodType;

  @IsEnum(AvailabilityStatus)
  @IsOptional()
  availabilityStatus?: AvailabilityStatus;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(Region)
  @IsOptional()
  region?: Region;

  @IsString()
  @IsOptional()
  landMark?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  medicalNotes?: string;
}
