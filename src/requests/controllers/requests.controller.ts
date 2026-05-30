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
import { RequestsService } from '../services/requests.service';
import { CreateRequestDto } from '../dto/create-request.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RequestStatus, UrgencyType } from '../entities/request.entity';
import { UpdateRequestDto } from '../dto/update-request.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DONOR, UserRole.REQUESTER)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.REQUESTER)
  @ApiBearerAuth()
  create(@Request() req: any, @Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(req.user.id, createRequestDto);
  }

  @Get()
  @ApiQuery({ name: 'status', enum: RequestStatus, required: false })
  @ApiQuery({ name: 'bloodType', required: false })
  @ApiQuery({ name: 'requesterId', required: false })
  @ApiQuery({ name: 'donorId', required: false })
  @ApiQuery({ name: 'urgencyType', enum: UrgencyType, required: false })
  findAll(
    @Query('status') status?: RequestStatus,
    @Query('bloodType') bloodType?: string,
    @Query('requesterId') requesterId?: string,
    @Query('donorId') donorId?: string,
    @Query('urgencyType') urgencyType?: UrgencyType,
  ) {
    return this.requestsService.findAll({
      status,
      bloodType,
      requesterId,
      donorId,
      urgencyType,
    });
  }

  /*@Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyRequests(@Request() req: any) {
    return this.requestsService.findAll(
      undefined,
      undefined,
      req.user.id,
      undefined,
      undefined,
    );
  }*/

  /*@Get("my-donations")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyDonations(@Request() req: any) {
    return this.requestsService.findAll(
      undefined,
      undefined,
      undefined,
      req.user.id,
      undefined,
    );
  }*/

  @Get('stats')
  getStats() {
    return this.requestsService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateData: UpdateRequestDto) {
    return this.requestsService.update(id, updateData);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: RequestStatus,
    @Body('rejectionReason') rejectionReason: string,
  ) {
    return this.requestsService.updateStatus(id, status, rejectionReason);
  }

  @Patch(':id/accept')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.DONOR)
  @ApiBearerAuth()
  acceptRequest(@Param('id') id: string, @Request() req: any) {
    return this.requestsService.acceptRequest(id, req.user.id);
  }

  @Patch(':id/assign-donor')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  assignDonor(@Param('id') id: string, @Body('donorId') donorId: string) {
    return this.requestsService.assignDonor(id, donorId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.requestsService.remove(id);
  }
}
