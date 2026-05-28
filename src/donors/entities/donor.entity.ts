import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BloodRequest } from '../../requests/entities/request.entity';
import { User } from '../../users/entities/user.entity';

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export const AvailabilityStatus = {
  AVAILABLE: true,
  UNAVAILABLE: false,
} as const;

export type AvailabilityStatus =
  (typeof AvailabilityStatus)[keyof typeof AvailabilityStatus];

export enum Region {
  KMC = 'KMC',
  WCR = 'WCR',
  NBR = 'NBR',
  LRR = 'LRR',
  URR = 'URR',
  CRR = 'CRR',
  BCC = 'BCC',
}

@Entity('donors')
export class Donor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: BloodType,
  })
  bloodType: BloodType;

  @Column({
    type: 'boolean',
    default: AvailabilityStatus.AVAILABLE,
  })
  availabilityStatus: AvailabilityStatus;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  lastDonationDate: Date;

  @Column({ type: 'text', nullable: true })
  medicalNotes: string;

  @OneToMany(() => BloodRequest, (request) => request.donor)
  requests: BloodRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
