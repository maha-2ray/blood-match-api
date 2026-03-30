import { IsEnum, IsNotEmpty, IsOptional, IsNumber, IsString, IsBoolean, IsDateString } from 'class-validator';
import { BloodType, AvailabilityStatus } from '../donor.entity';

export class CreateDonorDto {
  @IsEnum(BloodType)
  @IsNotEmpty()
  bloodType: BloodType;

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

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsBoolean()
  @IsOptional()
  canDonatePlatelets?: boolean;

  @IsBoolean()
  @IsOptional()
  canDonatePlasma?: boolean;

  @IsBoolean()
  @IsOptional()
  canDonateRedCells?: boolean;

  @IsString()
  @IsOptional()
  medicalNotes?: string;
}
