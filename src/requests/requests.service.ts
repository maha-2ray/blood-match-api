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

  async findAll(filters?: {
    status?: RequestStatus;
    bloodType?: string;
    requesterId?: string;
    donorId?: string;
    urgencyType?: UrgencyType;
  }): Promise<BloodRequest[]> {
    const query = this.requestsRepository.createQueryBuilder("request");
    if (filters?.status) {
      query.andWhere("request.status = :status", { status: filters.status });
    }
    if (filters?.bloodType) {
      query.andWhere("request.bloodType = :bloodType", {
        bloodType: filters.bloodType,
      });
    }
    if (filters?.requesterId) {
      query.andWhere("request.requesterId = :requesterId", {
        requesterId: filters.requesterId,
      });
    }
    if (filters?.donorId) {
      query.andWhere("request.donorId = :donorId", {
        donorId: filters.donorId,
      });
    }
    if (filters?.urgencyType) {
      query.andWhere("request.urgencyType = :urgencyType", {
        urgencyType: filters.urgencyType,
      });
    }
    query.orderBy("request.createdAt", "DESC");

    return query.getMany();
  }

  async findOne(id: string): Promise<BloodRequest> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ["requester", "donor", "donor.user"],
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
    const request = await this.requestsRepository.preload({
      type: updateData.type,
      bloodType: updateData.bloodType,
      unitsNeeded: updateData.unitsNeeded,
      patientName: updateData.patientName,
      patientAge: updateData.patientAge,
      hospitalName: updateData.hospitalName,
      hospitalAddress: updateData.hospitalAddress,
      hospitalLatitude: updateData.hospitalLatitude,
      hospitalLongitude: updateData.hospitalLongitude,
      requiredBy: updateData.requiredBy,
      notes: updateData.notes,
      isUrgent: updateData.isUrgent,
      donorId: updateData.donorId,
    });

    const savedRequest = await this.requestsRepository.save(request!);
    return savedRequest;
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
