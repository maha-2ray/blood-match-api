import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BloodRequest, RequestStatus, UrgencyType } from "./request.entity";
import { CreateRequestDto } from "./dto/create-request.dto";
import { UpdateRequestDto } from "./dto/update-request.dto";

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(BloodRequest)
    private requestsRepository: Repository<BloodRequest>,
  ) {}

  async create(
    requesterId: string,
    createRequestDto: CreateRequestDto,
  ): Promise<BloodRequest> {
    const request = this.requestsRepository.create({
      ...createRequestDto,
      requesterId,
    });

    return this.requestsRepository.save(request);
  }

  async findAll(
    status?: RequestStatus,
    bloodType?: string,
    requesterId?: string,
    donorId?: string,
    urgencyType?: UrgencyType,
  ): Promise<BloodRequest[]> {
    const query = this.requestsRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.requester", "requester")
      .leftJoinAndSelect("request.donor", "donor")
      .leftJoinAndSelect("donor.user", "donorUser")
      .select([
        "request.id",
        "request.type",
        "request.bloodType",
        "request.unitsNeeded",
        "request.status",
        "request.patientName",
        "request.patientAge",
        "request.hospitalName",
        "request.hospitalAddress",
        "request.hospitalLatitude",
        "request.hospitalLongitude",
        "request.requiredBy",
        "request.notes",
        "request.urgencyType",
        "request.createdAt",
        "requester.id",
        "requester.fullName",
        "requester.phone",
        "requester.email",
        "donor.id",
        "donorUser.id",
        "donorUser.fullName",
        "donorUser.phone",
      ]);

    if (status) {
      query.andWhere("request.status = :status", { status });
    }

    if (bloodType) {
      query.andWhere("request.bloodType = :bloodType", { bloodType });
    }

    if (requesterId) {
      query.andWhere("request.requesterId = :requesterId", { requesterId });
    }

    if (donorId) {
      query.andWhere("request.donorId = :donorId", { donorId });
    }

    if (urgencyType) {
      query.andWhere("request.requestType = :urgencyType", { urgencyType });
    }

    // if (isUrgent !== undefined) {
    //   query.andWhere('request.isUrgent = :isUrgent', { isUrgent });
    // }

    query.orderBy("request.createdAt", "DESC");

    return query.getMany();
  }

  async findOne(id: string): Promise<BloodRequest> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ["requester", "donor", "donor.user"],
      select: {
        requester: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
        donor: {
          id: true,
          bloodType: true,
        },
      },
    });

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    return request;
  }

  async update(
    id: string,
    updateData: UpdateRequestDto,
  ): Promise<BloodRequest> {
    const request = await this.findOne(id);

    Object.assign(request, updateData);
    return this.requestsRepository.save(request);
  }

  async updateStatus(
    id: string,
    status: RequestStatus,
    userId: string,
    rejectionReason?: string,
  ): Promise<BloodRequest> {
    const request = await this.findOne(id);

    if (request.donorId && request.donorId !== userId) {
      throw new ForbiddenException(
        "You are not authorized to update this request",
      );
    }

    request.status = status;
    if (rejectionReason) {
      request.rejectionReason = rejectionReason;
    }

    return this.requestsRepository.save(request);
  }

  async assignDonor(
    id: string,
    donorId: string,
    userId: string,
  ): Promise<BloodRequest> {
    const request = await this.findOne(id);

    if (request.requesterId !== userId) {
      throw new ForbiddenException(
        "You can only assign donors to your own requests",
      );
    }

    request.donorId = donorId;
    request.status = RequestStatus.ACCEPTED;

    return this.requestsRepository.save(request);
  }

  async remove(id: string): Promise<void> {
    const request = await this.findOne(id);

    await this.requestsRepository.delete(id);
  }

  async getStats(): Promise<any> {
    const totalRequests = await this.requestsRepository.count();
    const pendingRequests = await this.requestsRepository.count({
      where: { status: RequestStatus.PENDING },
    });
    const acceptedRequests = await this.requestsRepository.count({
      where: { status: RequestStatus.ACCEPTED },
    });
    const rejectedRequests = await this.requestsRepository.count({
      where: { status: RequestStatus.REJECTED },
    });
    // const criticalRequests = await this.requestsRepository.count({ where: { status: UrgencyType.CRITICAL } });
    // const moderateRequests = await this.requestsRepository.count({ where: { status: UrgencyType.MODERATE } });
    // const highRequests = await this.requestsRepository.count({ where: { urgencyType: UrgencyType.HIGH } });
    // const lowRequests = await this.requestsRepository.count({ where: { status: UrgencyType.LOW } });

    return {
      totalRequests,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
      // criticalRequests,
      // moderateRequests,
      // highRequests,
      // lowRequests
    };
  }
}
