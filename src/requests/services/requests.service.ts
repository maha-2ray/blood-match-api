import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BloodRequest,
  RequestStatus,
  UrgencyType,
} from '../entities/request.entity';
import { CreateRequestDto } from '../dto/create-request.dto';
import { UpdateRequestDto } from '../dto/update-request.dto';
import { DonorsService } from '../../donors/services/donors.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(BloodRequest)
    private readonly requestsRepository: Repository<BloodRequest>,
    private readonly donorsService: DonorsService,
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
    const query = this.requestsRepository.createQueryBuilder('request');
    if (filters?.status) {
      query.andWhere('request.status = :status', { status: filters.status });
    }
    if (filters?.bloodType) {
      query.andWhere('request.bloodType = :bloodType', {
        bloodType: filters.bloodType,
      });
    }
    if (filters?.requesterId) {
      query.andWhere('request.requesterId = :requesterId', {
        requesterId: filters.requesterId,
      });
    }
    if (filters?.donorId) {
      query.andWhere('request.donorId = :donorId', {
        donorId: filters.donorId,
      });
    }
    if (filters?.urgencyType) {
      query.andWhere('request.urgencyType = :urgencyType', {
        urgencyType: filters.urgencyType,
      });
    }
    query.orderBy('request.createdAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<BloodRequest> {
    const request = await this.requestsRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.requester', 'requester')
      .leftJoinAndSelect('request.donor', 'donor')
      .leftJoinAndSelect('donor.user', 'donorUser')
      .where('request.id = :id', { id })
      .getOne();
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async update(
    id: string,
    updateData: UpdateRequestDto,
  ): Promise<BloodRequest> {
    const request = await this.requestsRepository.preload({
      id,
      type: updateData.type,
      bloodType: updateData.bloodType,
      unitsNeeded: updateData.unitsNeeded,
      patientName: updateData.patientName,
      patientAge: updateData.patientAge,
      gender: updateData.gender,
      hospitalName: updateData.hospitalName,
      hospitalAddress: updateData.hospitalAddress,
      hospitalLatitude: updateData.hospitalLatitude,
      hospitalLongitude: updateData.hospitalLongitude,
      notes: updateData.notes,
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const savedRequest = await this.requestsRepository.save(request);
    return savedRequest;
  }

  async updateStatus(
    id: string,
    status: RequestStatus,
    rejectionReason?: string,
  ): Promise<BloodRequest> {
    const request = await this.findOne(id);

    request.status = status;
    if (rejectionReason) {
      request.rejectionReason = rejectionReason;
    }

    return this.requestsRepository.save(request);
  }

  async acceptRequest(id: string, userId: string): Promise<BloodRequest> {
    const request = await this.findOne(id);
    const donor = await this.donorsService.findByUserId(userId);

    if (request.requesterId === userId) {
      throw new ForbiddenException('You cannot accept your own request');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new ConflictException('Only pending requests can be accepted');
    }

    request.donorId = donor.id;
    request.status = RequestStatus.ACCEPTED;
    request.rejectionReason = null;

    return this.requestsRepository.save(request);
  }

  async assignDonor(id: string, donorId: string): Promise<BloodRequest> {
    const request = await this.findOne(id);

    request.donorId = donorId;
    request.status = RequestStatus.ACCEPTED;
    request.rejectionReason = null;

    return this.requestsRepository.save(request);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

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
