import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Donor, AvailabilityStatus, BloodType } from "./donor.entity";
import { CreateDonorDto } from "./dto/create-donor.dto";

@Injectable()
export class DonorsService {
  constructor(
    @InjectRepository(Donor)
    private donorsRepository: Repository<Donor>,
  ) {}

  async create(userId: string, createDonorDto: CreateDonorDto): Promise<Donor> {
    const existingDonor = await this.donorsRepository.findOne({
      where: { userId },
    });

    if (existingDonor) {
      throw new ConflictException("Donor profile already exists for this user");
    }

    const donor = this.donorsRepository.create({
      ...createDonorDto,
      userId,
    });

    return this.donorsRepository.save(donor);
  }

  async findAll(
    bloodType?: BloodType,
    availabilityStatus?: AvailabilityStatus,
    city?: string,
    country?: string,
  ): Promise<Donor[]> {
    const query = this.donorsRepository
      .createQueryBuilder("donor")
      .leftJoinAndSelect("donor.user", "user")
      .select([
        "donor.id",
        "donor.bloodType",
        "donor.availabilityStatus",
        "donor.latitude",
        "donor.longitude",
        "donor.address",
        "donor.city",
        "donor.country",
        "donor.donationsCount",
        "donor.lastDonationDate",
        "donor.canDonatePlatelets",
        "donor.canDonatePlasma",
        "donor.canDonateRedCells",
        "user.id",
        "user.fullName",
        "user.phone",
        "user.email",
      ]);

    if (bloodType) {
      query.andWhere("donor.bloodType = :bloodType", { bloodType });
    }

    if (availabilityStatus) {
      query.andWhere("donor.availabilityStatus = :availabilityStatus", {
        availabilityStatus,
      });
    }

    if (city) {
      query.andWhere("donor.city ILIKE :city", { city: `%${city}%` });
    }

    if (country) {
      query.andWhere("donor.country ILIKE :country", {
        country: `%${country}%`,
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Donor> {
    const donor = await this.donorsRepository.findOne({
      where: { id },
      relations: ["user"],
      select: {
        user: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    return donor;
  }

  async findByUserId(userId: string): Promise<Donor> {
    const donor = await this.donorsRepository.findOne({
      where: { userId },
      relations: ["user"],
    });

    if (!donor) {
      throw new NotFoundException("Donor profile not found");
    }

    return donor;
  }

  async update(id: string, updateData: Partial<Donor>): Promise<Donor> {
    const donor = await this.findOne(id);
    Object.assign(donor, updateData);
    return this.donorsRepository.save(donor);
  }

  async updateAvailability(
    userId: string,
    status: AvailabilityStatus,
  ): Promise<Donor> {
    const donor = await this.findByUserId(userId);
    donor.availabilityStatus = status;
    return this.donorsRepository.save(donor);
  }

  async updateLocation(
    userId: string,
    latitude: number,
    longitude: number,
  ): Promise<Donor> {
    const donor = await this.findByUserId(userId);
    donor.latitude = latitude;
    donor.longitude = longitude;
    return this.donorsRepository.save(donor);
  }

  async recordDonation(userId: string): Promise<Donor> {
    const donor = await this.findByUserId(userId);
    donor.donationsCount += 1;
    donor.lastDonationDate = new Date();
    return this.donorsRepository.save(donor);
  }

  async remove(id: string): Promise<void> {
    const result = await this.donorsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException("Donor not found");
    }
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radius: number = 10,
  ): Promise<Donor[]> {
    const donors = await this.donorsRepository
      .createQueryBuilder("donor")
      .leftJoinAndSelect("donor.user", "user")
      .select([
        "donor.id",
        "donor.bloodType",
        "donor.availabilityStatus",
        "donor.latitude",
        "donor.longitude",
        "donor.city",
        "donor.country",
        "donor.donationsCount",
        "user.id",
        "user.fullName",
        "user.phone",
      ])
      .where("donor.latitude IS NOT NULL")
      .andWhere("donor.longitude IS NOT NULL")
      .andWhere("donor.availabilityStatus = :status", {
        status: AvailabilityStatus.AVAILABLE,
      })
      .getMany();

    return donors.filter((donor) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        donor.latitude,
        donor.longitude,
      );
      return distance <= radius;
    });
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}
