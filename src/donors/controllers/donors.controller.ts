import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { DonorsService } from '../services/donors.service';
import { CreateDonorDto } from '../dto/create-donor.dto';
import { UpdateDonorDto } from '../dto/update-donor.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AvailabilityStatus, BloodType } from '../entities/donor.entity';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('donors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DONOR, UserRole.REQUESTER)
@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req: any, @Body() createDonorDto: CreateDonorDto) {
    return this.donorsService.create(req.user.id, createDonorDto);
  }

  @Get()
  @ApiQuery({
    name: 'availabilityStatus',
    enum: AvailabilityStatus,
    required: false,
  })
  findAll(
    @Query('availabilityStatus') availabilityStatus?: AvailabilityStatus,
  ) {
    return this.donorsService.findAll({
      availabilityStatus,
    });
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyProfile(@Request() req: any) {
    return this.donorsService.findOne(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateMyProfile(@Request() req: any, @Body() updateData: UpdateDonorDto) {
    return this.donorsService.update(req.user.id, updateData);
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
    return this.donorsService.findNearby(
      Number(latitude),
      Number(longitude),
      radius ? Number(radius) : 10,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.donorsService.findOne(id);
  }

  @Patch('availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateAvailability(
    @Request() req: any,
    @Body('status') status: AvailabilityStatus,
  ) {
    return this.donorsService.updateAvailability(req.user.id, status);
  }

  @Patch('location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateLocation(
    @Request() req: any,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    return this.donorsService.updateLocation(req.user.id, latitude, longitude);
  }

  @Patch('record-donation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  recordDonation(@Request() req: any) {
    return this.donorsService.recordDonation(req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateData: UpdateDonorDto) {
    return this.donorsService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.donorsService.remove(id);
  }
}
