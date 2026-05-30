import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailRegistrationVerification1778920500000 implements MigrationInterface {
  name = 'AddEmailRegistrationVerification1778920500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "otp_codes" RENAME COLUMN "phone" TO "email"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pending_registrations_role_enum" AS ENUM('donor', 'requester', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pending_registrations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "fullName" character varying NOT NULL, "password" character varying NOT NULL, "phone" character varying, "role" "public"."pending_registrations_role_enum" NOT NULL DEFAULT 'donor', "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_26ed1441f2043980ee384351f26" UNIQUE ("email"), CONSTRAINT "PK_f7d4c1ec02eeef64e86f7417f46" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pending_registrations"`);
    await queryRunner.query(
      `DROP TYPE "public"."pending_registrations_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otp_codes" RENAME COLUMN "email" TO "phone"`,
    );
  }
}
