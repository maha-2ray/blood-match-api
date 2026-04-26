import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from "typeorm";
import { Donor } from "../donors/donor.entity";

export enum UserRole {
  DONOR = "donor",
  REQUESTER = "requester",
  ADMIN = "admin",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  password?: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  phone: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.DONOR,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "timestamp", nullable: true })
  phoneVerifiedAt?: Date;

  @OneToOne(() => Donor, (donor) => donor.user)
  donorProfile: Donor;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
