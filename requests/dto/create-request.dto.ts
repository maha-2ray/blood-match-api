import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsDateString,
} from "class-validator";
import { UrgencyType } from "../request.entity";

export class CreateRequestDto {
  @IsEnum(UrgencyType)
  @IsOptional()
  type?: UrgencyType;

  @IsString()
  @IsNotEmpty()
  bloodType!: string;

  @IsNumber()
  @IsOptional()
  unitsNeeded?: number;

  @IsString()
  @IsNotEmpty()
  patientName!: string;

  @IsNumber()
  @IsOptional()
  patientAge?: number;

  @IsString()
  @IsNotEmpty()
  hospitalName!: string;

  @IsString()
  @IsNotEmpty()
  hospitalAddress!: string;

  @IsNumber()
  @IsOptional()
  hospitalLatitude?: number;

  @IsNumber()
  @IsOptional()
  hospitalLongitude?: number;

  @IsDateString()
  @IsNotEmpty()
  requiredBy!: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @IsString()
  @IsOptional()
  donorId?: string;
}
