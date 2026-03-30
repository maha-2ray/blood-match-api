import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AvailabilityStatus, BloodType } from './donor.entity';

@ApiTags('donors')
@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req, @Body() createDonorDto: CreateDonorDto) {
    return this.donorsService.create(req.user.id, createDonorDto);
  }

  @Get()
  @ApiQuery({ name: 'bloodType', enum: BloodType, required: false })
  @ApiQuery({ name: 'availabilityStatus', enum: AvailabilityStatus, required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'country', required: false })
  findAll(
    @Query('bloodType') bloodType?: BloodType,
    @Query('availabilityStatus') availabilityStatus?: AvailabilityStatus,
    @Query('city') city?: string,
    @Query('country') country?: string,
  ) {
    return this.donorsService.findAll(bloodType, availabilityStatus, city, country);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyProfile(@Request() req) {
    return this.donorsService.findByUserId(req.user.id);
  }

  @Get('nearby')
  @ApiQuery({ name: 'latitude', required: true })
  @ApiQuery({ name: 'longitude', required: true })
  @ApiQuery({ name: 'radius', required: false })
  findNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.donorsService.findNearby(Number(latitude), Number(longitude), radius ? Number(radius) : 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.donorsService.findOne(id);
  }

  @Patch('availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateAvailability(@Request() req, @Body('status') status: AvailabilityStatus) {
    return this.donorsService.updateAvailability(req.user.id, status);
  }

  @Patch('location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateLocation(
    @Request() req,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    return this.donorsService.updateLocation(req.user.id, latitude, longitude);
  }

  @Patch('record-donation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  recordDonation(@Request() req) {
    return this.donorsService.recordDonation(req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateData: Partial<any>) {
    return this.donorsService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.donorsService.remove(id);
  }
}
