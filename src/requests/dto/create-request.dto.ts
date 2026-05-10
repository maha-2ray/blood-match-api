import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { UrgencyType } from '../entities/request.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
  @ApiProperty({
    enum: UrgencyType,
    example: UrgencyType.HIGH,
    required: false,
  })
  @IsEnum(UrgencyType)
  @IsOptional()
  type?: UrgencyType;

  @ApiProperty({
    example: 'O+',
    description: 'Blood type required',
  })
  @IsString()
  @IsNotEmpty()
  bloodType!: string;

  @ApiProperty({
    example: 5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  unitsNeeded?: number;

  @ApiProperty({
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  patientName!: string;

  @ApiProperty({
    example: 45,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  patientAge?: number;

  @ApiProperty({
    example: 'City Hospital',
  })
  @IsString()
  @IsNotEmpty()
  hospitalName!: string;

  @ApiProperty({
    example: '123 Main Street, City',
  })
  @IsString()
  @IsNotEmpty()
  hospitalAddress!: string;

  @ApiProperty({
    example: 40.7128,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  hospitalLatitude?: number;

  @ApiProperty({
    example: -74.006,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  hospitalLongitude?: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  requiredBy!: Date;

  @ApiProperty({
    example: 'Emergency transfusion needed',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @ApiProperty({
    example: 'donor-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  donorId?: string;
}
