import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Donor } from '../../donors/entities/donor.entity';
import { User } from '../../users/entities/user.entity';

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum UrgencyType {
  CRITICAL = 'critical',
  MODERATE = 'moderate',
  HIGH = 'high',
  LOW = 'low',
}

@Entity('blood_requests')
export class BloodRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  requester: User;

  @Column()
  requesterId: string;

  @ManyToOne(() => Donor, { onDelete: 'CASCADE', nullable: true })
  donor: Donor;

  @Column({ nullable: true })
  donorId: string;

  @Column({
    type: 'enum',
    enum: UrgencyType,
  })
  type!: UrgencyType;

  @Column()
  bloodType: string;

  @Column({ type: 'int', default: 1 })
  unitsNeeded: number;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column()
  patientName: string;

  @Column({ nullable: true })
  patientAge: number;

  @Column({ nullable: true })
  gender: string;

  @Column()
  hospitalName: string;

  @Column()
  hospitalAddress: string;

  @Column({ type: 'float', nullable: true })
  hospitalLatitude: number;

  @Column({ type: 'float', nullable: true })
  hospitalLongitude: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: false })
  isUrgent: boolean;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
