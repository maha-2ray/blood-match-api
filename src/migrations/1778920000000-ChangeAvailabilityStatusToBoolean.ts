import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeAvailabilityStatusToBoolean1778920000000 implements MigrationInterface {
  name = 'ChangeAvailabilityStatusToBoolean1778920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add a temporary boolean column
    await queryRunner.query(
      `ALTER TABLE "donors" ADD "availabilityStatus_temp" boolean`,
    );

    // Copy data from enum to boolean (available=true, others=false)
    await queryRunner.query(
      `UPDATE "donors" SET "availabilityStatus_temp" = CASE WHEN "availabilityStatus" = 'available' THEN true ELSE false END`,
    );

    // Set default
    await queryRunner.query(
      `ALTER TABLE "donors" ALTER COLUMN "availabilityStatus_temp" SET DEFAULT true`,
    );

    // Drop old enum column
    await queryRunner.query(
      `ALTER TABLE "donors" DROP COLUMN "availabilityStatus"`,
    );

    // Rename temp column
    await queryRunner.query(
      `ALTER TABLE "donors" RENAME COLUMN "availabilityStatus_temp" TO "availabilityStatus"`,
    );

    // Drop the enum type
    await queryRunner.query(
      `DROP TYPE "public"."donors_availabilitystatus_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Create enum type again
    await queryRunner.query(
      `CREATE TYPE "public"."donors_availabilitystatus_enum" AS ENUM('available', 'busy', 'unavailable')`,
    );

    // Add temp column
    await queryRunner.query(
      `ALTER TABLE "donors" ADD "availabilityStatus_temp" "public"."donors_availabilitystatus_enum"`,
    );

    // Copy data back
    await queryRunner.query(
      `UPDATE "donors" SET "availabilityStatus_temp" = CASE WHEN "availabilityStatus" = true THEN 'available' ELSE 'unavailable' END`,
    );

    // Drop boolean column
    await queryRunner.query(
      `ALTER TABLE "donors" DROP COLUMN "availabilityStatus"`,
    );

    // Rename back
    await queryRunner.query(
      `ALTER TABLE "donors" RENAME COLUMN "availabilityStatus_temp" TO "availabilityStatus"`,
    );
  }
}
