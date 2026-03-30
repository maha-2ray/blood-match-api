import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Donor } from '../donors/donor.entity';

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RequestType {
  BLOOD = 'blood',
  PLATELETS = 'platelets',
  PLASMA = 'plasma',
  RED_CELLS = 'red_cells',
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
    enum: RequestType,
    default: RequestType.BLOOD,
  })
  type: RequestType;

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

  @Column()
  hospitalName: string;

  @Column()
  hospitalAddress: string;

  @Column({ type: 'float', nullable: true })
  hospitalLatitude: number;

  @Column({ type: 'float', nullable: true })
  hospitalLongitude: number;

  @Column({ type: 'timestamp' })
  requiredBy: Date;

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
