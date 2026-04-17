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
} from "@nestjs/common";
import { RequestsService } from "./requests.service";
import { CreateRequestDto } from "./dto/create-request.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { RequestStatus, UrgencyType } from "./request.entity";
import { UpdateRequestDto } from "./dto/update-request.dto";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../users/user.entity";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("requests")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DONOR, UserRole.REQUESTER)
@Controller("requests")
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req: any, @Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(req.user.id, createRequestDto);
  }

  @Get()
  @ApiQuery({ name: "status", enum: RequestStatus, required: false })
  @ApiQuery({ name: "bloodType", required: false })
  @ApiQuery({ name: "requesterId", required: false })
  @ApiQuery({ name: "donorId", required: false })
  @ApiQuery({ name: "urgencyType", enum: UrgencyType, required: false })
  findAll(
    @Query("status") status?: RequestStatus,
    @Query("bloodType") bloodType?: string,
    @Query("requesterId") requesterId?: string,
    @Query("donorId") donorId?: string,
    @Query("urgencyType") urgencyType?: UrgencyType,
  ) {
    return this.requestsService.findAll(
      status,
      bloodType,
      requesterId,
      donorId,
      urgencyType,
    );
  }

  @Get("my")
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
  }

  @Get("my-donations")
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
  }

  @Get("stats")
  getStats() {
    return this.requestsService.getStats();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.requestsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param("id") id: string, @Body() updateData: UpdateRequestDto) {
    return this.requestsService.update(id, updateData);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: RequestStatus,
    @Body("rejectionReason") rejectionReason: string,
    @Request() req: any,
  ) {
    return this.requestsService.updateStatus(
      id,
      status,
      req.user.id,
      rejectionReason,
    );
  }

  @Patch(":id/assign-donor")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  assignDonor(
    @Param("id") id: string,
    @Body("donorId") donorId: string,
    @Request() req: any,
  ) {
    return this.requestsService.assignDonor(id, donorId, req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param("id") id: string) {
    return this.requestsService.remove(id);
  }
}
