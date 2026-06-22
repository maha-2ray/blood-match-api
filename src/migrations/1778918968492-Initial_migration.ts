import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1778918968492 implements MigrationInterface {
  name = 'InitialMigration1778918968492';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."otp_codes_purpose_enum" AS ENUM('register', 'login')`,
    );
    await queryRunner.query(
      `CREATE TABLE "otp_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying NOT NULL, "purpose" "public"."otp_codes_purpose_enum" NOT NULL, "codeHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isUsed" boolean NOT NULL DEFAULT false, "attempts" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9d0487965ac1837d57fec4d6a26" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."blood_requests_type_enum" AS ENUM('critical', 'moderate', 'high', 'low')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."blood_requests_status_enum" AS ENUM('pending', 'accepted', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "blood_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requesterId" uuid NOT NULL, "donorId" uuid, "type" "public"."blood_requests_type_enum" NOT NULL, "bloodType" character varying NOT NULL, "unitsNeeded" integer NOT NULL DEFAULT '1', "status" "public"."blood_requests_status_enum" NOT NULL DEFAULT 'pending', "patientName" character varying NOT NULL, "patientAge" integer, "hospitalName" character varying NOT NULL, "hospitalAddress" character varying NOT NULL, "hospitalLatitude" double precision, "hospitalLongitude" double precision, "notes" text, "isUrgent" boolean NOT NULL DEFAULT false, "rejectionReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8abbf692f9b2a595b8ba9762b81" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."donors_bloodtype_enum" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."donors_availabilitystatus_enum" AS ENUM('available', 'busy', 'unavailable')`,
    );
    await queryRunner.query(
      `CREATE TABLE "donors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "bloodType" "public"."donors_bloodtype_enum" NOT NULL, "availabilityStatus" "public"."donors_availabilitystatus_enum" NOT NULL DEFAULT 'available', "latitude" double precision, "longitude" double precision, "address" character varying, "city" character varying, "region" character varying, "dateOfBirth" TIMESTAMP, "gender" character varying, "lastDonationDate" TIMESTAMP, "medicalNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_293976165d17c888acc7e254fa" UNIQUE ("userId"), CONSTRAINT "PK_7fafae759bcc8cc1dfa09c3fbcf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('donor', 'requester', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "password" character varying, "fullName" character varying NOT NULL, "phone" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'donor', "isActive" boolean NOT NULL DEFAULT true, "phoneVerifiedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "senderId" uuid NOT NULL, "receiverId" uuid NOT NULL, "content" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user1Id" uuid NOT NULL, "user2Id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "lastMessageAt" TIMESTAMP, CONSTRAINT "PK_c69082bd83bffeb71b0f455bd59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "blood_requests" ADD CONSTRAINT "FK_fe12d404685fdff9e6b28589620" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blood_requests" ADD CONSTRAINT "FK_a1eb1c514fe7e7eb927458f9a55" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "donors" ADD CONSTRAINT "FK_293976165d17c888acc7e254fa0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_fc6b58e41e9a871dacbe9077def" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_9a197c82c9ea44d75bc145a6e2c" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_rooms" ADD CONSTRAINT "FK_2322dead09ed7e80fa319b34173" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_rooms" ADD CONSTRAINT "FK_e6680ec6f61be06769227e9c995" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_rooms" DROP CONSTRAINT "FK_e6680ec6f61be06769227e9c995"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_rooms" DROP CONSTRAINT "FK_2322dead09ed7e80fa319b34173"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_9a197c82c9ea44d75bc145a6e2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_fc6b58e41e9a871dacbe9077def"`,
    );
    await queryRunner.query(
      `ALTER TABLE "donors" DROP CONSTRAINT "FK_293976165d17c888acc7e254fa0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blood_requests" DROP CONSTRAINT "FK_a1eb1c514fe7e7eb927458f9a55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blood_requests" DROP CONSTRAINT "FK_fe12d404685fdff9e6b28589620"`,
    );
    await queryRunner.query(`DROP TABLE "chat_rooms"`);
    await queryRunner.query(`DROP TABLE "chat_messages"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "donors"`);
    await queryRunner.query(
      `DROP TYPE "public"."donors_availabilitystatus_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."donors_bloodtype_enum"`);
    await queryRunner.query(`DROP TABLE "blood_requests"`);
    await queryRunner.query(`DROP TYPE "public"."blood_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."blood_requests_type_enum"`);
    await queryRunner.query(`DROP TABLE "otp_codes"`);
    await queryRunner.query(`DROP TYPE "public"."otp_codes_purpose_enum"`);
  }
}
