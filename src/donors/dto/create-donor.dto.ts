import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import {
  BloodType,
  Region,
  AvailabilityStatus,
} from '../entities/donor.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDonorDto {
  @ApiProperty({ example: 'Muhammed', required: true })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'your@email.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'O+', enum: BloodType })
  @IsEnum(BloodType)
  @IsNotEmpty()
  bloodType!: BloodType;

  @ApiProperty({
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  availabilityStatus?: AvailabilityStatus;

  @ApiProperty({ example: 24.7136, required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 46.6753, required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'RIYADH', required: false, enum: Region })
  @IsEnum(Region)
  @IsOptional()
  region?: Region;

  @ApiProperty({ example: 'Near Central Hospital', required: false })
  @IsString()
  @IsOptional()
  landMark?: string;

  @ApiProperty({ example: '1990-05-15', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiProperty({ example: 'Male', required: false })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: 'No allergies', required: false })
  @IsString()
  @IsOptional()
  medicalNotes?: string;

  @ApiProperty({ example: '+22000000000', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: "1990-05-15", required: false })
  @IsDateString()
  @IsOptional()
  lastDonationDate?: Date; 
}
