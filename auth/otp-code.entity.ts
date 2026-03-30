import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum OtpPurpose {
  REGISTER = "register",
  LOGIN = "login",
}

@Entity("otp_codes")
export class OtpCode {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  phone!: string;

  @Column({
    type: "enum",
    enum: OtpPurpose,
  })
  purpose!: OtpPurpose;

  @Column()
  codeHash!: string;

  @Column({ type: "timestamp" })
  expiresAt!: Date;

  @Column({ default: false })
  isUsed!: boolean;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
